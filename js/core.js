/* Pure progress and assessment rules. Kept separate for testing and future APIs. */
(function(root) {
  'use strict';
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const stateFor = (p, s, u) => p.progress[`${s.id}/${u.id}`] || { done: [], passed: false };
  const unlocked = (p,s,i) => i===0 || s.units.slice(0,i).every(u=>stateFor(p,s,u).passed);
  const unitProgress = (p,s,u) => {
    const state=stateFor(p,s,u);
    const done=u.topics.filter(t=>state.done.includes(t.id)).length;
    if(u.readingOnly)return u.topics.length ? Math.round(done/u.topics.length*100) : 0;
    return u.topics.length ? Math.round((done+(state.passed?1:0))/(u.topics.length+1)*100) : 0;
  };
  const subjectProgress = (p,s) => s.units.length ? Math.round(s.units.reduce((n,u)=>n+unitProgress(p,s,u),0)/s.units.length) : 0;
  const quizReady = (p,s,u) => u.available && u.questions.length>=5 && u.topics.every(t=>stateFor(p,s,u).done.includes(t.id)) && unlocked(p,s,s.units.indexOf(u));
  const grandReady = (p,s) => s.units.length>0 && s.units.every(u=>u.available && u.questions.length>=5 && stateFor(p,s,u).passed);
  function shuffle(a, rng = Math.random) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }
  function pickQuestions(unit,count=5) {
    const groups=shuffle([...new Set(unit.questions.map(q=>q.topic))]);
    const chosen=groups.slice(0,count).map(topic=>shuffle(unit.questions.filter(q=>q.topic===topic))[0]);
    return shuffle([...chosen,...shuffle(unit.questions.filter(q=>!chosen.includes(q))).slice(0,count-chosen.length)]);
  }
  function makeAttempt(subject,unit) {
    const grand=!unit;
    const questions=grand ? shuffle(subject.units.flatMap(u=>pickQuestions(u,5))) : pickQuestions(unit,5);
    return {id:uid(),subjectId:subject.id,unitId:unit?.id||'grand',questions,answers:{},index:0,startedAt:Date.now(),deadline:Date.now()+(grand?20:5)*60000};
  }
  function scoreAttempt(a) {
    const correct=a.questions.filter(q=>a.answers[q.id]===q.answer).length;
    const percent=Math.round(correct/a.questions.length*100);
    return {...a,correct,total:a.questions.length,percent,passed:percent>=80,finishedAt:Date.now()};
  }
  function currentUnit(p,s) { return s.units.find(u=>!stateFor(p,s,u).passed) || s.units[0]; }
  function streak(days,now=new Date()) {
    let d=new Date(now); const set=new Set(days); if(!set.has(localDay(d)))d.setDate(d.getDate()-1);
    let n=0; while(set.has(localDay(d))){n++;d.setDate(d.getDate()-1);} return n;
  }
  function weekDays(now=new Date()) {const d=new Date(now); d.setDate(d.getDate()-(d.getDay()+6)%7);return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(x.getDate()+i);return localDay(x);});}
  function gpa(records) {const rows=records.filter(r=>r.type==='endsem' && Number.isFinite(r.points) && r.credits>0);return rows.length ? (rows.reduce((s,r)=>s+r.points*r.credits,0)/rows.reduce((s,r)=>s+r.credits,0)).toFixed(2) : null;}
  function newProfile(name,identity,role='student',semester=1) {return {id:uid(),name,identity,role,currentSemester:semester,progress:{},attempts:[],activeQuiz:null,lastLesson:null,bookmarks:[],notes:{},events:[],results:[],activity:[],weeklyGoal:4,settings:{theme:'light',font:100,reading:false},createdAt:Date.now()};}
  root.CompassCore={uid,localDay,stateFor,unlocked,unitProgress,subjectProgress,quizReady,grandReady,shuffle,pickQuestions,makeAttempt,scoreAttempt,currentUnit,streak,weekDays,gpa,newProfile};
})(globalThis);
