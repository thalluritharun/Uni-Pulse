/* Weekly timetable transcribed from the supplied campus screenshot. */
(function(root) {
  'use strict';
  const slots = [
    ['09:00','09:50'], ['10:00','10:50'], ['11:00','11:50'], ['12:00','12:50'],
    ['13:00','13:50'], ['14:00','14:50'], ['15:00','15:50'], ['16:00','17:30']
  ];
  const days = [
    ['Monday',    [101,102,104,105,null,106,101,103]],
    ['Tuesday',   [101,102,104,105,null,106,102,103]],
    ['Wednesday', [104,105,101,102,null,106,104,103]],
    ['Thursday',  [105,104,102,101,null,106,105,null]],
    ['Friday',    [102,105,101,104,null,null,null,103]],
    ['Saturday',  [null,null,null,null,null,null,null,null]]
  ];
  const subjects = [
    [101,'Problem Solving and Critical Thinking','3-0-2-4'],
    [102,'Engineering Mathematics for Product Engineers','3-1-0-4'],
    [103,'AI Interaction Design','3-0-0-3'],
    [104,'Problem Solving and Object-Oriented Programming Fundamentals','3-0-2-4'],
    [105,'Data Structure and Algorithmic Problem Solving','3-0-2-4'],
    [106,'Introduction to Global Coding Competitions','0-0-4-2']
  ].map(([number,name,credits])=>({number,code:`PEA ${number}`,name,credits}));
  const room = 'NAB 204', faculty = 'Mr. Yenuganti Vasudeva Rao (Tmp139)';
  const timetable = {slots,days,subjects,room,faculty};
  // A finite week, not an invented term date range. Nothing is written to profiles.
  function events(now=new Date()) {
    const monday=new Date(now);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    return days.flatMap(([day,classes],index)=>classes.flatMap((number,slot)=>{
      if(!number)return [];
      const date=new Date(monday);date.setDate(date.getDate()+index);
      const localDay=root.CompassCore.localDay(date),[start,end]=slots[slot];
      const subject=subjects.find(s=>s.number===number);
      return [{id:`class-${localDay}-${slot}`,title:`${subject.code} · ${subject.name}`,subject:subject.code,
        date:`${localDay}T${start}`,endDate:`${localDay}T${end}`,type:'Class',room,readOnly:true,
        timetable:true,done:false,details:`${day} · ${room} · ${faculty}`}];
    }));
  }
  // Floating weekly recurrence: screenshot supplies weekly slots, no term dates/timezone.
  function calendarLines(escape,now=new Date()) {
    const monday=new Date(now);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    const codes=['MO','TU','WE','TH','FR','SA'];
    return days.flatMap(([day,classes],index)=>classes.flatMap((number,slot)=>{
      if(!number)return [];
      const [start,end]=slots[slot],dayDate=new Date(monday);dayDate.setDate(dayDate.getDate()+index);
      const date=root.CompassCore.localDay(dayDate).replace(/-/g,'');
      const subject=subjects.find(s=>s.number===number);
      return ['BEGIN:VEVENT',`UID:weekly-${codes[index]}-${slot}@uni-pulse.local`,
        'DTSTAMP:20260101T000000Z',`DTSTART:${date}T${start.replace(':','')}00`,
        `DTEND:${date}T${end.replace(':','')}00`,`RRULE:FREQ=WEEKLY;BYDAY=${codes[index]}`,
        `SUMMARY:${escape(`${subject.code} · ${subject.name}`)}`,`LOCATION:${escape(room)}`,
        `DESCRIPTION:${escape(`${day} · ${faculty}. Weekly timetable; term dates were not supplied.`)}`,
        'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',`DESCRIPTION:${escape(subject.code+' class')}`,
        'END:VALARM','END:VEVENT'];
    }));
  }
  root.UniPulseTimetable={...timetable,events,calendarLines};
})(globalThis);
