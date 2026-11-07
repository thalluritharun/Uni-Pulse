'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createServer,makeAccount}=require('../server.cjs');

test('faculty authorization, revocation, rate limiting, and private-file isolation',async t=>{
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'uni-pulse-auth-test-'));
  const facultyFile=path.join(temporary,'accounts.json');
  const server=createServer({facultyFile});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const api=(route,body,headers={})=>fetch(origin+route,body===undefined?{headers}:{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  const credentials={email:'approved@institution.example',password:'separate-test-password'};
  let cookie;
  try {
    await t.test('unconfigured access stays closed',async()=>{
      assert.equal((await api('/api/faculty/session')).status,401);
      const response=await api('/api/faculty/login',credentials);assert.equal(response.status,503);
    });
    const approved=await makeAccount('Approved Faculty',credentials.email,credentials.password);
    const unapproved={...await makeAccount('Unapproved Faculty','pending@institution.example',credentials.password),approved:false};
    fs.writeFileSync(facultyFile,JSON.stringify([approved,unapproved]));
    await t.test('unapproved identities and wrong passwords are rejected',async()=>{
      assert.equal((await api('/api/faculty/login',{...credentials,email:unapproved.email})).status,401);
      assert.equal((await api('/api/faculty/login',{...credentials,password:'incorrect'})).status,401);
      assert.equal((await api('/api/faculty/login',{...credentials,email:'unknown@institution.example'})).status,401);
    });
    await t.test('cross-origin sign-in is rejected',async()=>{
      assert.equal((await api('/api/faculty/login',credentials,{Origin:'https://other.example'})).status,403);
    });
    await t.test('approved credentials create an HttpOnly session without exposing hashes',async()=>{
      const response=await api('/api/faculty/login',credentials);assert.equal(response.status,200);
      const raw=response.headers.get('set-cookie');assert.match(raw,/HttpOnly/);assert.match(raw,/SameSite=Strict/);
      cookie=raw.split(';')[0];
      const data=await response.json();assert.equal(data.faculty.email,credentials.email);assert.equal(data.faculty.role,'faculty');
      assert.equal(data.faculty.salt,undefined);assert.equal(data.faculty.passwordHash,undefined);
      assert.equal((await api('/api/faculty/session',undefined,{Cookie:cookie})).status,200);
    });
    await t.test('revoked approval invalidates an existing session',async()=>{
      fs.writeFileSync(facultyFile,JSON.stringify([{...approved,approved:false}]));
      assert.equal((await api('/api/faculty/session',undefined,{Cookie:cookie})).status,401);
      fs.writeFileSync(facultyFile,JSON.stringify([approved]));
      assert.equal((await api('/api/faculty/session',undefined,{Cookie:cookie})).status,401);
    });
    await t.test('logout invalidates the server session',async()=>{
      const login=await api('/api/faculty/login',credentials);
      assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
      assert.equal((await api('/api/faculty/session',undefined,{Cookie:cookie})).status,200);
      assert.equal((await api('/api/faculty/logout',{}, {Cookie:cookie})).status,200);
      assert.equal((await api('/api/faculty/session',undefined,{Cookie:cookie})).status,401);
    });
    await t.test('private files and server source are not exposed',async()=>{
      for(const route of ['/.git/config','/.private/faculty-accounts.json','/server.cjs','/scripts/approve-faculty.cjs','/js/%2e%2e%2fserver.cjs','/js/%2e%2e%5cserver.cjs'])assert.equal((await fetch(origin+route)).status,404,route);
      assert.equal((await fetch(origin+'/')).status,200);
      assert.equal((await fetch(origin+'/js/timetable.js')).status,200);
    });
    await t.test('malformed input is rejected and repeated attempts are limited',async()=>{
      assert.equal((await api('/api/faculty/login',null)).status,400);
      let response;
      for(let i=0;i<12;i++){response=await api('/api/faculty/login',{...credentials,password:'incorrect'});if(response.status===429)break;}
      assert.equal(response.status,429);assert.ok(Number(response.headers.get('retry-after'))>0);
    });
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(temporary,{recursive:true,force:true});}
});
