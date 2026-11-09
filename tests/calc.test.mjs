import test from 'node:test';
import assert from 'node:assert/strict';
import {balances,calendarFile,calendarMonth,dateFromISO,english,localISO} from '../lib/calc.ts';
const people=['a','b','c'].map(id=>({id,name:id,role:'guest',createdAt:0}));
test('expense totals and equal shares conserve every toman, including remainders',()=>{
 const e=[{amount:100,payerId:'a',participantIds:['c','b','a']}];
 const x=balances(people,e);
 assert.deepEqual(x.members.map(m=>m.share),[34,33,33]);
 assert.equal(x.members.reduce((n,m)=>n+m.balance,0),0);
 assert.deepEqual(x.settlements,[{from:'b',to:'a',amount:33},{from:'c',to:'a',amount:33}]);
});
test('only selected members split a cost, while third-party payer is credited',()=>{
 const x=balances(people,[{amount:101,payerId:'c',participantIds:['a','b']},{amount:40,payerId:'a',participantIds:['a','c']}]);
 assert.deepEqual(x.members.map(m=>m.share),[71,50,20]);
 assert.deepEqual(x.members.map(m=>m.balance),[-31,-50,81]);
 const settled=new Map(x.members.map(m=>[m.id,m.balance]));
 for(const s of x.settlements){settled.set(s.from,settled.get(s.from)+s.amount);settled.set(s.to,settled.get(s.to)-s.amount);}
 assert.deepEqual([...settled.values()],[0,0,0]);
});
test('Persian and Arabic numerals normalize correctly',()=>{
 assert.equal(english('۱۲۳۴۵۶۷۸۹۰ ١٢٣٤٥٦٧٨٩٠'),'1234567890 1234567890');
});
test('Persian calendar handles both leap and ordinary Esfand',()=>{
 const leap=calendarMonth(dateFromISO('2025-03-05')),normal=calendarMonth(dateFromISO('2026-03-05'));
 assert.equal(leap.count,30);assert.equal(normal.count,29);
 assert.equal(localISO(leap.next),'2025-03-21');assert.equal(localISO(normal.next),'2026-03-21');
});
test('calendar export uses Tehran time and escapes injected text',()=>{
 const s=calendarFile('قرار\nEND:VEVENT','2026-11-13','18:00','پارک، شیراز','https://example.org/g/123');
 assert.ok(s.includes('DTSTART:20261113T143000Z\r\n'));
 assert.ok(s.includes('DTEND:20261113T163000Z\r\n'));
 assert.ok(s.includes('SUMMARY:قرار\\nEND:VEVENT\r\n'));
 assert.equal(s.split('\r\n').filter(x=>x==='END:VEVENT').length,1);
});
