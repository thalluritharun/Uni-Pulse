/* Run only by an institution administrator after independently verifying approval. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const readline=require('node:readline/promises');
const {makeAccount}=require('../server.cjs');
async function hiddenPassword(prompt) {
  if(!process.stdin.isTTY)throw Error('Use an interactive terminal to enter a password privately.');
  process.stdout.write(prompt);
  const input=process.stdin,wasRaw=input.isRaw;input.setRawMode(true);input.resume();
  return new Promise((resolve,reject)=>{
    let value='';
    function finish(error){input.off('data',onData);input.setRawMode(!!wasRaw);input.pause();process.stdout.write('\n');error?reject(error):resolve(value);}
    function onData(data){for(const char of data.toString('utf8')){
      if(char==='\u0003')return finish(Error('Cancelled.'));
      if(char==='\r'||char==='\n')return finish();
      if(char==='\u007f'||char==='\b')value=value.slice(0,-1);
      else if(char>=' '&&value.length<129)value+=char;
    }}
    input.on('data',onData);
  });
}
(async()=>{
  console.log('Provision an institution-approved faculty account. No account is created by default.');
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  let email,name,confirmed;
  try {
    email=(await rl.question('Approved faculty email: ')).trim().toLowerCase();
    name=(await rl.question('Faculty display name: ')).trim();
    confirmed=(await rl.question('Has the institution approved this person? Type APPROVED: ')).trim();
  } finally {rl.close();}
  if(confirmed!=='APPROVED')throw Error('Institution approval is required.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!name||name.length>60)throw Error('Enter a valid email and a display name of 1–60 characters.');
  const password=await hiddenPassword('Set a separate Uni Pulse password (12–128 characters; hidden): ');
  if(password.length<12||password.length>128)throw Error('Use a password of 12–128 characters.');
  if(password!==await hiddenPassword('Confirm password (hidden): '))throw Error('Passwords do not match.');
  const file=process.env.UNIPULSE_FACULTY_FILE||path.join(__dirname,'..','.private','faculty-accounts.json');
  const accounts=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
  if(!Array.isArray(accounts))throw Error('The account file must contain an array.');
  const previous=accounts.find(a=>a.email===email),account=await makeAccount(name,email,password,previous?.id);
  const next=[...accounts.filter(a=>a.email!==email),account];
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{mode:0o600});
  console.log('Approved account saved on this server. Keep .private out of Git.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
