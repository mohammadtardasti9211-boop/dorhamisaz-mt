import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Run the actual API and SQL against an isolated database; no production records.
const sql=new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys=ON');
sql.exec(readFileSync(new URL('../drizzle/0000_lively_maginty.sql',import.meta.url),'utf8'));
sql.prepare("INSERT INTO gatherings(id,title,kind,created_at) VALUES(?,?,?,?)").run('0'.repeat(32),'قدیمی','cafe',1);
sql.prepare("INSERT INTO members(id,event_id,name,token_hash,created_at) VALUES(?,?,?,?,?)").run('1'.repeat(32),'0'.repeat(32),'همراه قدیمی','old',1);
sql.exec(readFileSync(new URL('../drizzle/0001_swift_meggan.sql',import.meta.url),'utf8'));
function prepared(query,args=[]){return {bind(...values){return prepared(query,values)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return sql.prepare(query).run(...args)}}}
const env={DB:{prepare:prepared,async batch(statements){return Promise.all(statements.map(s=>s.all()))}}};
const source=readFileSync(new URL('../lib/server.ts',import.meta.url),'utf8').replace('import {env} from "cloudflare:workers";','');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};new Function('env','exports',compiled)(env,exports);
const {act,createEvent,readEvent,handle}=exports;
function request(data,token){return new Request('https://local.test/api/events',{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(data?{body:JSON.stringify(data)}:{})})}
async function action(event,token,body){const r=await handle(()=>act(request(body,token),event.id));return {status:r.status,data:await r.json()}}
let host,guest,other;
test('migration preserves existing people and gives them pending attendance',()=>{assert.equal(sql.prepare('SELECT attendance FROM members WHERE id=?').get('1'.repeat(32)).attendance,'pending')});
test('named attendance and discussion enforce membership, authorship and persistence',async()=>{
 host=await createEvent(request({title:'آزمایش',hostName:'میزبان',kind:'picnic',times:[{date:'2026-11-12',time:'18:00'}],places:[]}));
 guest=(await action(host,null,{action:'join',name:'همراه اول'})).data;
 other=(await action(host,null,{action:'join',name:'همراه دوم'})).data;
 assert.equal((await action(host,null,{action:'rsvp',name:'ناشناس',status:'yes'})).status,401);
 assert.equal((await action(host,guest.token,{action:'rsvp',name:'سارا',status:'bad'})).status,400);
 assert.equal((await action(host,guest.token,{action:'rsvp',name:'سارا',status:'yes'})).status,200);
 assert.equal((await action(host,guest.token,{action:'addComment',text:'ساعت ۷ مناسب‌تره',topic:'time'})).status,200);
 assert.equal((await action(host,null,{action:'addComment',text:'ناشناس',topic:'time'})).status,401);
 assert.equal((await action(host,guest.token,{action:'addComment',text:' ',topic:'time'})).status,400);
 let data=await readEvent(request(undefined,guest.token),host.id);
 assert.equal(data.me.name,'سارا');assert.equal(data.me.attendance,'yes');
 assert.equal(data.comments[0].body,'ساعت ۷ مناسب‌تره');assert.equal(data.comments[0].authorId,guest.memberId);
 const commentId=data.comments[0].id;
 assert.equal((await action(host,other.token,{action:'deleteComment',commentId})).status,403);
 assert.equal((await action(host,host.token,{action:'deleteComment',commentId})).status,200);
 data=await readEvent(request(undefined,guest.token),host.id);assert.equal(data.comments.length,0);
 const separate=await createEvent(request({title:'قرار دوم',hostName:'میزبان دوم',times:[{date:'2026-11-12',time:'19:00'}],places:[]}));
 assert.equal((await action(separate,guest.token,{action:'rsvp',name:'نفوذ',status:'no'})).status,401);
 assert.equal((await readEvent(request(),separate.id)).comments.length,0);
 sql.close();
});
