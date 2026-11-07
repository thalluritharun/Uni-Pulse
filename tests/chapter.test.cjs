/* Run with node tests/chapter.test.cjs. No third-party packages required. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const context=vm.createContext({crypto:webcrypto});context.window=context;
for(const file of ['data.js','core.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file),'utf8'),context);
const C=context.CompassCore,subject=context.CAMPUS_DATA.subjects[0],unit=subject.units[0],topic=unit.topics[0];
const profile=C.newProfile('Chapter student','chapter-student');
const original=JSON.stringify(context.CAMPUS_DATA);
let checks=0;
const check=(name,run)=>{run();checks++;console.log('PASS '+name);};

check('chapter needs its reading completed without requiring every other reading',()=>{
  assert.equal(C.chapterReady(profile,subject,unit,topic),false);
  profile.progress[`${subject.id}/${unit.id}`]={done:[topic.id],passed:false};
  assert.equal(C.chapterReady(profile,subject,unit,topic),true);
  assert.equal(C.chapterReady(profile,subject,unit,topic.id),true);
  assert.equal(C.quizReady(profile,subject,unit),false);
  assert.equal(C.chapterReady(profile,subject,unit,'missing-topic'),false);
});
check('each chapter quiz uses up to five questions from its selected chapter',()=>{
  for(const chapter of unit.topics){
    for(let i=0;i<10;i++){
      const attempt=C.makeAttempt(subject,unit,chapter);
      assert.equal(attempt.topicId,chapter.id);assert.equal(attempt.unitId,unit.id);
      const count=Math.min(5,C.chapterQuestions(unit,chapter).length);
      assert.equal(attempt.questions.length,count);assert.equal(new Set(attempt.questions.map(q=>q.id)).size,count);
      assert.ok(attempt.questions.every(q=>q.topic===chapter.id));
      assert.equal(attempt.deadline-attempt.startedAt,300000);
    }
  }
});
check('larger chapter banks are sampled without duplicate questions or bank changes',()=>{
  const copy=JSON.parse(JSON.stringify(subject)),copyUnit=copy.units[0];
  copyUnit.questions.push({...copyUnit.questions.find(q=>q.topic===topic.id),id:'extra-chapter-question'});
  const before=JSON.stringify(copy),selected=new Set();
  for(let i=0;i<30;i++){
    const attempt=C.makeAttempt(copy,copyUnit,topic.id);
    assert.equal(attempt.questions.length,5);assert.equal(new Set(attempt.questions.map(q=>q.id)).size,5);
    attempt.questions.forEach(q=>selected.add(q.id));
  }
  assert.equal(JSON.stringify(copy),before);assert.equal(selected.size,6);
});
check('short or missing chapter banks cannot create partial or grand attempts',()=>{
  const copy=JSON.parse(JSON.stringify(subject)),copyUnit=copy.units[0];
  copyUnit.questions=copyUnit.questions.filter(q=>q.topic!==topic.id).concat(copyUnit.questions.filter(q=>q.topic===topic.id).slice(0,2));
  assert.equal(C.chapterReady(profile,copy,copyUnit,topic.id),false);
  assert.throws(()=>C.makeAttempt(copy,copyUnit,topic.id),/at least three questions/);
  assert.throws(()=>C.makeAttempt(subject,null,topic.id),/at least three questions/);
  assert.throws(()=>C.makeAttempt(subject,unit,'missing-topic'),/at least three questions/);
});
check('three-question chapters and the existing four-question chapter are supported',()=>{
  const copy=JSON.parse(JSON.stringify(subject)),copyUnit=copy.units[0];
  copyUnit.questions=copyUnit.questions.filter(q=>q.topic!==topic.id).concat(copyUnit.questions.filter(q=>q.topic===topic.id).slice(0,3));
  assert.equal(C.chapterReady(profile,copy,copyUnit,topic.id),true);
  assert.equal(C.makeAttempt(copy,copyUnit,topic.id).questions.length,3);
  const decomposition=unit.topics.find(t=>t.id==='decomposition');
  assert.equal(C.makeAttempt(subject,unit,decomposition).questions.length,4);
});
check('unavailable and sequentially locked units cannot offer a chapter quiz',()=>{
  const copy=JSON.parse(JSON.stringify(subject)),later=copy.units[1],laterTopic=later.topics[0];
  later.available=true;later.questions=unit.questions.slice(0,5).map((q,i)=>({...q,id:`later-${i}`,topic:laterTopic.id}));
  profile.progress[`${copy.id}/${later.id}`]={done:[laterTopic.id],passed:false};
  assert.equal(C.chapterReady(profile,copy,later,laterTopic),false);
  profile.progress[`${copy.id}/${copy.units[0].id}`].passed=true;
  assert.equal(C.chapterReady(profile,copy,later,laterTopic),true);
  later.available=false;assert.equal(C.chapterReady(profile,copy,later,laterTopic),false);
  profile.progress[`${copy.id}/${copy.units[0].id}`].passed=false;
});
check('chapter scoring preserves topic identity and does not mutate unit completion',()=>{
  const attempt=C.makeAttempt(subject,unit,topic);
  for(const question of attempt.questions.slice(0,4))attempt.answers[question.id]=question.answer;
  const before=JSON.stringify(profile),result=C.scoreAttempt(attempt);
  assert.equal(result.topicId,topic.id);assert.equal(result.percent,80);assert.equal(result.passed,true);
  assert.equal(JSON.stringify(profile),before);assert.equal(C.stateFor(profile,subject,unit).passed,false);
  assert.equal(C.grandReady(profile,subject),false);
});
check('unit and grand attempts keep their existing scope and timing',()=>{
  const attempt=C.makeAttempt(subject,unit);
  assert.equal(attempt.topicId,undefined);assert.equal(attempt.unitId,unit.id);
  assert.equal(attempt.questions.length,5);assert.equal(new Set(attempt.questions.map(q=>q.topic)).size,5);
  assert.equal(attempt.deadline-attempt.startedAt,300000);
  const full=JSON.parse(JSON.stringify(subject));
  for(const u of full.units)u.questions=unit.questions.map(q=>({...q,id:`${u.id}-${q.id}`}));
  const grand=C.makeAttempt(full,null);
  assert.equal(grand.topicId,undefined);assert.equal(grand.unitId,'grand');assert.equal(grand.questions.length,25);
  assert.equal(grand.deadline-grand.startedAt,1200000);
});
check('original subject material and question banks are unchanged',()=>{
  assert.equal(JSON.stringify(context.CAMPUS_DATA),original);
});
console.log(`${checks} chapter assessment checks passed.`);
