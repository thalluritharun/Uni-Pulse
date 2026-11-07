/* Local auth server. Institution administrators provision approved faculty offline.
 * Learning records and publications remain browser-local; see docs/FACULTY-ACCESS.md.
 */
'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes,scrypt,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const derive=promisify(scrypt);
const SESSION_MS=8*60*60*1000;
const publicAccount=a=>({id:a.id,email:a.email,name:a.name,role:'faculty'});
const accountPath=()=>process.env.UNIPULSE_FACULTY_FILE||path.join(__dirname,'.private','faculty-accounts.json');
function loadAccounts(file) {
  const accounts=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!Array.isArray(accounts))throw Error('Invalid approved account file');
  return accounts.filter(a=>a.approved===true && typeof a.id==='string' && typeof a.email==='string' &&
    typeof a.name==='string' && /^[a-f0-9]{32}$/.test(a.salt) && /^[a-f0-9]{128}$/.test(a.passwordHash));
}
async function makeAccount(name,email,password,id=randomBytes(16).toString('hex')) {
  const salt=randomBytes(16).toString('hex');
  const hash=await derive(password,salt,64);
  return {id,name,email:email.toLowerCase().trim(),approved:true,salt,passwordHash:hash.toString('hex')};
}
function createServer({root=__dirname,facultyFile=accountPath(),publicOrigin=process.env.UNIPULSE_ORIGIN}={}) {
  const sessions=new Map(),attempts=new Map();
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const token=req=>(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('uni-pulse-faculty='))?.slice(18);
  function sessionAccount(req) {
    const key=token(req),session=sessions.get(key);
    if(!session||session.expires<=Date.now()){sessions.delete(key);return null;}
    try{const account=loadAccounts(facultyFile).find(a=>a.id===session.id);if(!account)sessions.delete(key);return account||null;}catch{sessions.delete(key);return null;}
  }
  const cookie=(value,origin,age)=>`uni-pulse-faculty=${value}; HttpOnly; SameSite=Strict; Path=/api/faculty; Max-Age=${age}${origin.startsWith('https:')?'; Secure':''}`;
  const server=http.createServer(async(req,res)=>{
    try {
      const origin=publicOrigin||`http://${req.headers.host}`;
      const url=new URL(req.url,origin);
      if(url.pathname.startsWith('/api/')) {
        if(req.method==='GET'&&url.pathname==='/api/faculty/session') {
          const account=sessionAccount(req);
          return json(res,account?200:401,account?{faculty:publicAccount(account)}:{error:'Faculty authorization is required.'});
        }
        if(req.method!=='POST'||!['/api/faculty/login','/api/faculty/logout'].includes(url.pathname))return json(res,404,{error:'Not found.'});
        if(req.headers.origin!==origin)return json(res,403,{error:'Open faculty sign-in from this website.'});
        if(url.pathname==='/api/faculty/logout') {
          sessions.delete(token(req));res.setHeader('Set-Cookie',cookie('',origin,0));return json(res,200,{ok:true});
        }
        if(!(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'JSON is required.'});
        for(const [key,entry] of attempts)if(entry.until<=Date.now())attempts.delete(key);
        for(const [key,entry] of sessions)if(entry.expires<=Date.now())sessions.delete(key);
        const address=req.socket.remoteAddress;
        const attempt=attempts.get(address)||{count:0,until:Date.now()+15*60*1000};
        if(attempt.count>=10){res.setHeader('Retry-After',String(Math.ceil((attempt.until-Date.now())/1000)));return json(res,429,{error:'Too many attempts. Try again in 15 minutes.'});}
        attempts.set(address,{...attempt,count:attempt.count+1});
        let body='',length=0;
        for await(const chunk of req){length+=chunk.length;if(length>4096){return json(res,413,{error:'Request is too large.'});}body+=chunk.toString('utf8');}
        let input;try{input=JSON.parse(body);}catch{return json(res,400,{error:'Invalid request.'});}
        const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'';
        const password=typeof input?.password==='string'?input.password:'';
        if(!email||email.length>254||!password||password.length>128)return json(res,400,{error:'Enter your approved faculty email and password.'});
        let accounts;try{accounts=loadAccounts(facultyFile);}catch{return json(res,503,{error:'Faculty access is not configured. Ask your institution administrator to approve your account.'});}
        const account=accounts.find(a=>a.email===email);
        const actual=await derive(password,account?.salt||'00000000000000000000000000000000',64);
        const expected=account?Buffer.from(account.passwordHash,'hex'):Buffer.alloc(64);
        if(!timingSafeEqual(actual,expected)||!account)return json(res,401,{error:'Email or password is incorrect, or this account is not approved.'});
        const key=randomBytes(32).toString('hex');
        sessions.delete(token(req));sessions.set(key,{id:account.id,expires:Date.now()+SESSION_MS});
        res.setHeader('Set-Cookie',cookie(key,origin,SESSION_MS/1000));
        return json(res,200,{faculty:publicAccount(account)});
      }
      if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
      let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return json(res,400,{error:'Invalid path.'});}
      if(pathname==='/')pathname='/index.html';
      if(pathname.includes('\\')||pathname.split('/').some(p=>p.startsWith('.'))||
        !/^\/(index\.html|(?:js|css|assets|resources)\/[^\0]+)$/.test(pathname))return json(res,404,{error:'Not found.'});
      const base=fs.realpathSync(root),file=path.resolve(base,'.'+pathname);
      let real;try{real=fs.realpathSync(file);}catch{return json(res,404,{error:'Not found.'});}
      const relative=path.relative(base,real);
      if(relative.startsWith('..')||path.isAbsolute(relative))return json(res,404,{error:'Not found.'});
      const stat=fs.statSync(real);if(!stat.isFile())return json(res,404,{error:'Not found.'});
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8'};
      res.writeHead(200,{'Content-Type':types[path.extname(real)]||'application/octet-stream','Content-Length':stat.size,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
      if(req.method==='HEAD')return res.end();
      fs.createReadStream(real).on('error',()=>res.destroy()).pipe(res);
    } catch {if(!res.headersSent)json(res,500,{error:'Unable to complete the request.'});else res.end();}
  });
  server.requestTimeout=15000;
  return server;
}
if(require.main===module) {
  const port=Number(process.env.PORT||8000);
  createServer().listen(port,'127.0.0.1',()=>console.log(`Uni Pulse: http://127.0.0.1:${port}`));
}
module.exports={createServer,makeAccount};
