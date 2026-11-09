import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFileSync} from 'node:fs';
test('standalone API permits Pages, rejects other origins, and persists a shared event',async()=>{
 const mf=new Miniflare({modules:true,script:readFileSync(new URL('../cloudflare/worker.js',import.meta.url),'utf8'),compatibilityDate:'2026-05-15',d1Databases:['DB']});
 try{
 const db=await mf.getD1Database('DB');
 const statements=readFileSync(new URL('../cloudflare/new-database.sql',import.meta.url),'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean);
 for(const sql of statements)await db.prepare(sql).run();
 const origin='https://mohammadtardasti9211-boop.github.io';
 let response=await mf.dispatchFetch('https://api.example/api/health',{headers:{Origin:origin}});assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
 response=await mf.dispatchFetch('https://api.example/api/events',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Headers':'authorization,content-type'}});assert.equal(response.status,204);
 response=await mf.dispatchFetch('https://api.example/api/events',{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:'{}'});assert.equal(response.status,403);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
 response=await mf.dispatchFetch('https://api.example/api/events',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Sec-Fetch-Site':'cross-site'},body:JSON.stringify({title:'قرار مشترک',hostName:'آزمایش',times:[{date:'2026-11-13',time:'18:00'}],places:[]})});assert.equal(response.status,200);
 const created=await response.json();
 response=await mf.dispatchFetch(`https://api.example/api/events/${created.id}`,{headers:{Origin:origin,Authorization:`Bearer ${created.token}`}});
 const event=await response.json();assert.equal(event.me.name,'آزمایش');assert.equal(event.event.title,'قرار مشترک');
 response=await mf.dispatchFetch(`https://api.example/api/events/${created.id}`);assert.equal((await response.json()).me,null);
 }finally{await mf.dispose()}
});
