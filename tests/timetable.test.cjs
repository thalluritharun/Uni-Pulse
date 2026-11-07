'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ctx=vm.createContext({crypto:require('node:crypto').webcrypto});
for(const file of ['core.js','timetable.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file),'utf8'),ctx);
const timetable=ctx.UniPulseTimetable;
assert.equal(timetable.days.length,6);
assert.deepEqual(Array.from(timetable.days[0][1]),[101,102,104,105,null,106,101,103]);
assert.deepEqual(Array.from(timetable.days[1][1]),[101,102,104,105,null,106,102,103]);
assert.deepEqual(Array.from(timetable.days[2][1]),[104,105,101,102,null,106,104,103]);
assert.deepEqual(Array.from(timetable.days[3][1]),[105,104,102,101,null,106,105,null]);
assert.deepEqual(Array.from(timetable.days[4][1]),[102,105,101,104,null,null,null,103]);
assert.ok(timetable.days[5][1].every(x=>x===null));
assert.equal(timetable.room,'NAB 204');
for(const now of [new Date(2026,10,6,12),new Date(2026,10,8,12)]){
  const events=timetable.events(now);assert.equal(events.length,32);assert.equal(new Set(events.map(e=>e.id)).size,32);
  assert.ok(events.every(e=>e.date.startsWith('2026-11-0')&&!e.sample&&e.readOnly));
  assert.equal(events.filter(e=>e.date.startsWith('2026-11-02')).length,7);
  assert.equal(events.filter(e=>e.date.startsWith('2026-11-06')).length,5);
  for(const event of events)assert.equal((new Date(event.endDate)-new Date(event.date))/60000,event.date.endsWith('16:00')?90:50);
}
const lines=timetable.calendarLines(String),calendar=lines.join('\r\n');
assert.equal(lines.filter(l=>l==='BEGIN:VEVENT').length,32);
assert.equal(lines.filter(l=>l.startsWith('RRULE:')).length,32);
assert.ok(!calendar.includes('BYDAY=SA'));
assert.equal(lines.filter(l=>l==='LOCATION:NAB 204').length,32);
console.log('PASS timetable: screenshot rows, empty periods, 32 unique classes, exact durations, current week, weekly calendar recurrence');
