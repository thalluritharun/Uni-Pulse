/* Run with: node tests/core.test.cjs — no third-party packages required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(root, 'js', name), 'utf8');
let checks=0;
const ok=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const context=vm.createContext({crypto:webcrypto,console});context.window=context;
vm.runInContext(source('data.js'),context);vm.runInContext(source('core.js'),context);
const C=context.CompassCore,D=context.CAMPUS_DATA,s=D.subjects[0],u=s.units[0];
const clone=x=>JSON.parse(JSON.stringify(x));
const p=C.newProfile('Test Student','test-student');

ok('supplied syllabus and question bank are complete',()=>{
 assert.equal(D.subjects.length,6);assert.equal(s.units.length,5);assert.equal(s.units.reduce((n,u)=>n+u.topics.length,0),30);assert.equal(u.questions.length,30);
 assert.equal(new Set(u.questions.map(q=>q.id)).size,30);
 for(const q of u.questions){assert.equal(q.options.length,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(u.topics.some(t=>t.id===q.topic));assert.ok(q.explanation.length>10);}
 for(const t of u.topics){assert.ok(t.sections.length);assert.ok(t.example.text);assert.ok(t.task);}
});
ok('new students have isolated progress and all later units locked',()=>{
 const other=C.newProfile('Other Student','other');p.notes.example='Only this student';assert.equal(other.notes.example,undefined);
 assert.equal(C.subjectProgress(p,s),0);assert.equal(C.unlocked(p,s,0),true);assert.equal(C.unlocked(p,s,1),false);assert.equal(C.quizReady(p,s,u),false);
});
ok('completing all lessons unlocks quiz but not next unit',()=>{
 p.progress['pea101/u1']={done:u.topics.map(t=>t.id),passed:false};assert.equal(C.unitProgress(p,s,u),86);assert.equal(C.quizReady(p,s,u),true);assert.equal(C.unlocked(p,s,1),false);
});
ok('random selection has five distinct questions and topic coverage',()=>{
 for(let i=0;i<50;i++){const qs=C.pickQuestions(u);assert.equal(qs.length,5);assert.equal(new Set(qs.map(q=>q.id)).size,5);assert.equal(new Set(qs.map(q=>q.topic)).size,5);}
});
ok('unanswered questions are incorrect and four of five passes',()=>{
 const a=C.makeAttempt(s,u);assert.equal(a.questions.length,5);assert.ok(Math.abs(a.deadline-a.startedAt-300000)<100);
 assert.equal(C.scoreAttempt(a).correct,0);assert.equal(C.scoreAttempt(a).passed,false);
 for(const q of a.questions.slice(0,3))a.answers[q.id]=q.answer;assert.equal(C.scoreAttempt(a).percent,60);assert.equal(C.scoreAttempt(a).passed,false);
 a.answers[a.questions[3].id]=a.questions[3].answer;assert.equal(C.scoreAttempt(a).percent,80);assert.equal(C.scoreAttempt(a).passed,true);
});
ok('passed unit unlocks the next outline without inventing material',()=>{
 p.progress['pea101/u1'].passed=true;assert.equal(C.unitProgress(p,s,u),100);assert.equal(C.subjectProgress(p,s),20);assert.equal(C.unlocked(p,s,1),true);assert.equal(C.unlocked(p,s,2),false);assert.equal(s.units[1].available,false);assert.equal(C.quizReady(p,s,s.units[1]),false);assert.equal(C.grandReady(p,s),false);
});
ok('grand test becomes ready only after every unit is supplied and passed',()=>{
 const full=clone(s),student=C.newProfile('Grand Test','grand');for(const unit of full.units){unit.available=true;unit.questions=clone(u.questions).map(q=>({...q,id:unit.id+'-'+q.id,sourceUnit:unit.id}));student.progress[`${s.id}/${unit.id}`]={done:unit.topics.map(t=>t.id),passed:true};}
 assert.equal(C.grandReady(student,full),true);const grand=C.makeAttempt(full,null);assert.equal(grand.questions.length,25);assert.equal(new Set(grand.questions.map(q=>q.id)).size,25);assert.ok(Math.abs(grand.deadline-grand.startedAt-1200000)<100);for(const unit of full.units)assert.equal(grand.questions.filter(q=>q.sourceUnit===unit.id).length,5);
 student.progress['pea101/u3'].passed=false;assert.equal(C.grandReady(student,full),false);student.progress['pea101/u3'].passed=true;full.units[3].available=false;assert.equal(C.grandReady(student,full),false);
});
ok('GPA is credit weighted, includes zero, and excludes assignment scores',()=>{
 assert.equal(C.gpa([]),null);assert.equal(C.gpa([{type:'endsem',points:8,credits:4},{type:'endsem',points:6,credits:2},{type:'assignment',score:95,max:100}]),'7.33');assert.equal(C.gpa([{type:'endsem',points:0,credits:3},{type:'endsem',points:10,credits:3}]),'5.00');
});
ok('streak and week calculations handle dates across a month boundary',()=>{
 const today=new Date(2026,9,2,12);assert.equal(C.streak(['2026-09-30','2026-10-01','2026-10-02'],today),3);assert.equal(C.streak(['2026-09-30','2026-10-01'],today),2);assert.equal(C.streak(['2026-09-29'],today),0);assert.equal(C.weekDays(today).length,7);assert.equal(C.weekDays(today)[0],'2026-09-28');
});

// Lightweight rendering/event harness. This does not emulate a browser layout engine.
// Forms with an input named "id" expose that input as form.id, not their ID string.
function appHarness(profiles,sessionId,initial='#home',rawOverride){
 const handlers={},winHandlers={},nodes={};
 function node(sel){if(sel==='.lesson-copy')return nodes['#app']?.innerHTML.includes('class="lesson-copy"')?{}:null;if(!nodes[sel])nodes[sel]={innerHTML:'',textContent:'',value:'',style:{setProperty(name,value){this[name]=value;}},dataset:{},open:false,disabled:false,checked:false,isConnected:true,classList:{add(){},remove(){},toggle(){}},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},focus(){},setAttribute(){},appendChild(){},append(){},remove(){},click(){},matches(){return false;},querySelector(){return node('#form-button');},querySelectorAll(){return [];}};return nodes[sel];}
 const document={querySelector:node,querySelectorAll(){return [];},getElementById:id=>node('#'+id),createElement:tag=>node('created-'+tag),body:{classList:{toggle(){},remove(){}},appendChild(){}},documentElement:{dataset:{},style:{}},activeElement:{tagName:'BODY'},addEventListener(name,fn){(handlers[name] ||= []).push(fn);},title:''};
 let stored=rawOverride===undefined?JSON.stringify({version:1,users:profiles}):rawOverride,session=sessionId;
 const loc={_hash:initial,get hash(){return this._hash;},set hash(v){this._hash=v.startsWith('#')?v:'#'+v;}};
 const ctx=vm.createContext({document,location:loc,crypto:webcrypto,console,TextEncoder,Blob,URL,Date,setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},localStorage:{getItem(){return stored;},setItem(k,v){stored=v;}},sessionStorage:{getItem(){return session;},setItem(k,v){session=v;},removeItem(){session=null;}},FormData:class{constructor(form){this.data=form.data;}get(k){return this.data[k]??null;}}});
 ctx.window=ctx;ctx.addEventListener=(name,fn)=>(winHandlers[name] ||= []).push(fn);ctx.scrollTo=()=>{};ctx.matchMedia=()=>({matches:false});
 for(const script of ['data.js','core.js','campus.js','focus.js','faculty.js','learning-sources.js','learning-content.js','app.js'])vm.runInContext(source(script),ctx,{filename:script});
 const dispatch=(group,name,event)=>Promise.all((group[name] || []).map(fn=>fn(event)));
 return {ctx,nodes,html:()=>node('#app').innerHTML,data:()=>JSON.parse(stored),route(hash){loc.hash=hash;return dispatch(winHandlers,'hashchange',{});},click(action,data={}){const button={dataset:{action,...data},disabled:false};return dispatch(handlers,'click',{preventDefault(){},target:{closest(sel){if(sel==='[data-action]')return button;const prefix=sel.match(/^\[data-action\^="([^"]+)"\]$/)?.[1];return prefix&&action.startsWith(prefix)?button:null;}}});},submit(id,data,submitterValue){return dispatch(handlers,'submit',{preventDefault(){},submitter:{value:submitterValue},target:{id:Object.hasOwn(data,'id')?{name:'id',value:data.id}:id,data,isConnected:true,getAttribute(name){return name==='id'?id:null;},matches(){return false;},querySelector(){return node('#submit');},querySelectorAll(){return [];}}});},change(target){return dispatch(handlers,'change',{target:{dataset:{},...target}});},input(target){return dispatch(handlers,'input',{target:{dataset:{},...target}});}};
}
const testProfile=C.newProfile('A <Student>','a-test');
const app=appHarness([testProfile],testProfile.id);
ok('dashboard renders and escapes user-supplied names',()=>{assert.ok(app.html().includes('A &lt;Student&gt;'));assert.ok(app.html().includes('Your workspace'));assert.ok(!app.html().includes('<Student>'));});
ok('every main route and every supplied lesson renders without exceptions',()=>{
 for(const route of ['#learning','#schedule','#report','#saved','#announcements','#profile','#subject/pea102','#subject/pea101/u2','#subject/pea101/grand','#quiz']){app.route(route);assert.ok(app.html().length>1000,route);}
 for(const topic of app.ctx.CAMPUS_DATA.subjects[0].units[0].topics){app.route(`#subject/pea101/u1/${topic.id}`);assert.ok(app.html().includes(topic.title));}
});
ok('future semester tabs and direct subject access are guarded',()=>{app.route('#learning');assert.ok(app.html().includes('data-value="2" class="" aria-pressed="false" disabled'));app.ctx.CAMPUS_DATA.subjects[1].semester=3;app.route('#subject/pea102');assert.ok(app.html().includes('This subject is unavailable'));app.ctx.CAMPUS_DATA.subjects[1].semester=1;});
ok('corrupted browser storage presents a warning instead of crashing',()=>{const broken=appHarness([],null,'#home','{"invalid":true}');assert.ok(broken.html().includes('Browser storage could not be loaded'));});

(async()=>{
 for(const t of u.topics){app.route(`#subject/pea101/u1/${t.id}`);await app.click('complete-topic',{key:`pea101/u1/${t.id}`});}
 ok('completion events persist all six lessons',()=>{assert.equal(app.data().users[0].progress['pea101/u1'].done.length,6);});
 await app.click('start-quiz',{subject:'pea101',unit:'u1'});app.route('#quiz');
 ok('quiz starts after completing lessons and retains active attempt',()=>{assert.equal(app.data().users[0].activeQuiz.questions.length,5);assert.ok(app.html().includes('A little check-in.'));});
 for(let i=0;i<5;i++){const q=app.data().users[0].activeQuiz.questions[i];await app.click('quiz-jump',{index:String(i)});app.change({name:'quiz-answer',value:String(i<4?q.answer:(q.answer+1)%4)});}
 const during=app.data().users[0];const reload=appHarness([during],during.id,'#quiz');
 ok('saved attempt survives a new app instance without extending its deadline',()=>{assert.equal(reload.data().users[0].activeQuiz.deadline,during.activeQuiz.deadline);assert.equal(Object.keys(reload.data().users[0].activeQuiz.answers).length,5);});
 await app.click('submit-quiz');await app.click('confirm');app.route(app.ctx.location.hash);
 ok('passing submission records a review and unlocks unit 2',()=>{const p=app.data().users[0];assert.equal(p.activeQuiz,null);assert.equal(p.attempts[0].percent,80);assert.equal(p.progress['pea101/u1'].passed,true);assert.ok(app.html().includes('Your answers, explained'));app.route('#subject/pea101/u2');assert.ok(app.html().includes('Unit unlocked'));});
 await app.submit('event-form',{title:'Test deadline',date:'2026-12-01T14:00',type:'Assignment',subject:'PEA 101',details:'Bring a report',id:''});app.route('#schedule');
 ok('schedule events persist separately from other student profiles',()=>{assert.equal(app.data().users[0].events.length,1);assert.equal(app.data().users[0].events[0].title,'Test deadline');const other=appHarness([C.newProfile('Second','second')],null);assert.ok(other.html().includes('Welcome back to Uni Pulse.'));assert.ok(!other.html().includes('WELCOME TO UNI PULSE'));assert.equal(other.data().users[0].events.length,0);});
 await app.submit('result-form',{id:'',type:'endsem',semester:'1',subject:'PEA 101',title:'End semester',date:'2026-12-01',points:'8',credits:'4'});
 await app.submit('result-form',{id:'',type:'endsem',semester:'1',subject:'PEA 102',title:'End semester',date:'2026-12-01',points:'6',credits:'2'});app.route('#report');
 ok('report form and rendering calculate credit-weighted GPA',()=>{assert.equal(app.data().users[0].results.length,2);assert.ok(app.html().includes('7.33'));});
 await app.submit('result-form',{id:'',type:'assignment',semester:'1',subject:'PEA 101',title:'Invalid',date:'2026-12-01',score:'120',max:'100'});
 await app.submit('result-form',{id:'',type:'endsem',semester:'1',subject:'PEA101 · Duplicate',title:'Duplicate',date:'2026-12-01',points:'9',credits:'4'});
 ok('invalid marks and duplicate end-sem entries are rejected',()=>{assert.equal(app.data().users[0].results.length,2);});
 app.route('#subject/pea101/u1/framing');app.input({id:'lesson-note',dataset:{key:'pea101/u1/framing'},value:'<script>not HTML</script>'});await app.click('bookmark',{key:'pea101/u1/framing'});app.route('#saved');
 ok('notes persist and are escaped on saved-items page',()=>{assert.ok(app.html().includes('&lt;script&gt;'));assert.ok(!app.html().includes('<script>not HTML'));assert.equal(app.data().users[0].bookmarks.length,1);});
 const exp=clone(during);exp.activeQuiz.deadline=Date.now()-1;const expired=appHarness([exp],exp.id,'#quiz');
 ok('expired saved attempts are scored automatically on reopen',()=>{assert.equal(expired.data().users[0].activeQuiz,null);assert.equal(expired.data().users[0].attempts[0].expired,true);});
 const faculty=C.newProfile('Faculty','faculty','faculty');const facultyApp=appHarness([faculty],faculty.id);facultyApp.route('#learning');
 ok('faculty access stays in its dedicated publishing workspace',()=>{assert.equal(facultyApp.ctx.location.hash,'#home');assert.ok(facultyApp.html().includes('YOUR TEACHING STUDIO'));facultyApp.route('#faculty-materials');assert.ok(facultyApp.html().includes('Your teaching library.'));facultyApp.route('#faculty-students');assert.ok(facultyApp.html().includes('Sample student'));assert.equal(facultyApp.data().users.length,1);});
 facultyApp.route('#faculty-students/sample-arya');
 ok('sample faculty reports include current marks and previous semester final results',()=>{assert.ok(facultyApp.html().includes('CLA 1'));assert.ok(facultyApp.html().includes('Assignment 1'));assert.ok(facultyApp.html().includes('Previous semester final'));assert.ok(facultyApp.html().includes('Sample report'));assert.equal(facultyApp.data().users.length,1);assert.equal(facultyApp.data().users[0].results.length,0);});
 const postBody='  Exact notes <script>text only</script>\nSecond paragraph.  ';
 await facultyApp.submit('faculty-post-form',{id:'',type:'notes',subjectId:'pea101',title:'Faculty reading',body:postBody,dueAt:''},'draft');
 ok('faculty form with a hidden id field saves a private draft and preserves full content',()=>{assert.equal(facultyApp.data().publications.length,1);assert.equal(facultyApp.data().publications[0].status,'draft');assert.equal(facultyApp.data().publications[0].body,postBody);assert.equal(facultyApp.data().publications[0].authorId,faculty.id);});
 const draftId=facultyApp.data().publications[0].id;
 const draftDB=facultyApp.data();draftDB.users.push(testProfile);
 const draftReader=appHarness(draftDB.users,testProfile.id,'#material/'+draftId,JSON.stringify(draftDB));
 ok('student profiles cannot read unpublished faculty drafts',()=>{assert.ok(draftReader.html().includes('Post unavailable'));assert.ok(!draftReader.html().includes('Exact notes'));});
 await facultyApp.click('faculty-publish',{id:draftId});
 const publishedDB=facultyApp.data();publishedDB.users.push(testProfile);
 const reader=appHarness(publishedDB.users,testProfile.id,'#material/'+draftId,JSON.stringify(publishedDB));
 ok('published faculty content reaches local students with safe HTML escaping',()=>{assert.equal(facultyApp.data().publications[0].status,'published');assert.ok(reader.html().includes('  Exact notes &lt;script&gt;text only&lt;/script&gt;\nSecond paragraph.  '));assert.ok(!reader.html().includes('<script>text only</script>'));reader.route('#learning');assert.ok(reader.html().includes('Faculty reading'));});
 const sem2=C.newProfile('Second semester','second-semester','student',2),sem2App=appHarness([sem2],sem2.id,'#report');
 ok('sample semester marks stay outside personal results and calendar events',()=>{assert.ok(sem2App.html().includes('CLA 1'));assert.ok(sem2App.html().includes('Assignment 1'));assert.equal(sem2App.data().users[0].results.length,0);assert.equal(sem2App.data().users[0].events.length,0);});
 await sem2App.click('semester',{value:'1'});
 ok('earlier semester sample results expose GPA from final credits',()=>{const previous=sem2App.ctx.UniPulseCampus.results(2).filter(r=>r.semester===1);assert.ok(sem2App.html().includes('Semester 1 final result'));assert.ok(sem2App.html().includes(C.gpa(previous)));assert.equal(sem2App.data().users[0].results.length,0);});
 await sem2App.click('report-mode',{value:'personal'});
 ok('My records hides sample marks without adding any personal rows',()=>{assert.ok(sem2App.html().includes('Your results will tell a story'));assert.ok(!sem2App.html().includes('Semester 1 final result'));assert.equal(sem2App.data().users[0].results.length,0);});
 const readingStudent=C.newProfile('Reader','reader'),readingApp=appHarness([readingStudent],readingStudent.id);
 const ai=readingApp.ctx.CAMPUS_DATA.subjects.find(s=>s.id==='pea103'),aiUnit=ai.units[0];
 for(const topic of aiUnit.topics){readingApp.route(`#subject/${ai.id}/${aiUnit.id}/${topic.id}`);await readingApp.click('complete-topic',{key:`${ai.id}/${aiUnit.id}/${topic.id}`});}
 ok('reading-only collections reach 100 percent without requiring an invented quiz',()=>{const profile=readingApp.data().users[0],state=profile.progress[`${ai.id}/${aiUnit.id}`];assert.equal(aiUnit.readingOnly,true);assert.equal(state.done.length,aiUnit.topics.length);assert.equal(state.passed,true);assert.equal(C.unitProgress(profile,ai,aiUnit),100);assert.equal(profile.attempts.length,0);assert.equal(profile.activeQuiz,null);});
 const auth=appHarness([],null);await auth.click('auth-switch');await auth.submit('auth-form',{name:'Local User',identity:'local-user',password:'practice-only-123',semester:'1'});
 ok('local sign-up stores a salted verifier, never a plain password',()=>{const p=auth.data().users[0];assert.ok(p.auth.salt.length>=32);assert.equal(p.auth.hash.length,64);assert.ok(!JSON.stringify(auth.data()).includes('practice-only-123'));});
 await auth.click('logout');await auth.click('auth-switch');await auth.submit('auth-form',{identity:'local-user',password:'wrong-password'});
 ok('incorrect local password is rejected',()=>{assert.ok(auth.nodes['#auth-error'].textContent.includes('does not match'));});
 await auth.submit('auth-form',{identity:'local-user',password:'practice-only-123'});
 ok('correct local password resumes the matching profile',()=>{assert.ok(auth.html().includes('Your workspace'));});
 console.log(`\n${checks} checks passed. Browser layout testing remains a separate manual step.`);
})().catch(err=>{console.error(err);throw err;});
