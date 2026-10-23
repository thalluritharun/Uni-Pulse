/* Illustrative campus content. Never mixed into a student's own academic records. */
(function(root){
  const subjects=()=>root.CAMPUS_DATA.subjects;
  function events(){
    const slots=['2026-10-29T09:00','2026-10-29T11:00','2026-10-31T10:00','2026-11-03T09:00','2026-11-03T11:00','2026-11-04T10:00'];
    const exams=subjects().map((s,i)=>({id:`sample-cla2-${s.id}`,title:`CLA 2 · ${s.name}`,subject:s.code,date:slots[i],type:'Test',details:'CLA 2 timetable · subject order and times are illustrative. Confirm the room and duration with faculty.',sample:true,done:false}));
    return [...exams,
      {id:'sample-guest-ai',title:'Guest lecture · Designing with AI',subject:'PEA 103',date:'2026-10-26T14:00',type:'Guest lecture',details:'Sample guest session · human-centred AI, live examples and a student Q&A. Speaker and venue to be confirmed.',sample:true,done:false},
      {id:'sample-guest-code',title:'Guest lecture · From classroom code to real projects',subject:'PEA 104 / PEA 106',date:'2026-10-28T15:00',type:'Guest lecture',details:'Sample workshop · debugging, collaboration and a coding-career Q&A.',sample:true,done:false},
      {id:'sample-assignment-101',title:'Assignment 2 · Problem representation',subject:'PEA 101',date:'2026-10-27T23:59',type:'Assignment',details:'Sample deadline · submit your problem statement, IPO model and flowchart.',sample:true,done:false},
      {id:'sample-assignment-103',title:'Assignment 1 · AI interaction journal',subject:'PEA 103',date:'2026-11-02T23:59',type:'Assignment',details:'Sample deadline · document your prompts, iterations and observations.',sample:true,done:false}];
  }
  function results(currentSemester){
    const records=[];
    for(let semester=1;semester<=currentSemester;semester++){
      subjects().forEach((s,i)=>{
        const base={subject:`${s.code} · ${s.name}`,semester,source:'sample',sample:true};
        if(semester<currentSemester)records.push({...base,id:`sample-final-${semester}-${i}`,type:'endsem',title:`Semester ${semester} final result`,points:[8,9,8,7,9,8][(i+semester-1)%6],credits:[3,4,3,4,4,2][i],date:'2026-05-20'});
        else {
          records.push({...base,id:`sample-cla-${semester}-${i}`,type:'test',title:'CLA 1',score:[24,27,26,22,25,28][i],max:30,date:'2026-10-09'});
          records.push({...base,id:`sample-work-${semester}-${i}`,type:'assignment',title:'Assignment 1',score:[17,19,18,16,18,19][i],max:20,date:'2026-10-16'});
        }
      });
    }
    return records;
  }
  function notifications(){return [
    {id:'sample-notice-cla',category:'Assessments',title:'CLA 2: your six-subject plan',body:'Two papers on Thursday 29 October, one on Saturday 31 October, two on Tuesday 3 November, and one on Wednesday 4 November. Open Schedule for subjects and illustrative times.',date:'2026-10-23',href:'#schedule',sample:true},
    {id:'sample-notice-guest',category:'Campus',title:'Make room for a new perspective',body:'Two sample guest sessions are on your calendar: AI interaction design and real-world coding. Add your own confirmed campus details when available.',date:'2026-10-23',href:'#schedule',sample:true},
    {id:'sample-notice-report',category:'Reports',title:'Your semester at a glance',body:'Explore sample CLA and assignment marks for your current semester, and completed GPA records for earlier semesters. Switch to My records to see only your own results.',date:'2026-10-22',href:'#report',sample:true}
  ];}
  root.UniPulseCampus={events,results,notifications};
})(globalThis);
