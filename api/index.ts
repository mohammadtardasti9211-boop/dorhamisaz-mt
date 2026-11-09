import {env} from "cloudflare:workers";
import {act,createEvent,handle,readEvent} from "../lib/server";
const siteOrigin="https://mohammadtardasti9211-boop.github.io";
export default {async fetch(request:Request){
 const url=new URL(request.url),origin=request.headers.get("Origin");
 const local=["localhost","127.0.0.1"].includes(url.hostname);
 const allowed=origin===siteOrigin||(local&&origin!==null&&/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
 if(origin&&!allowed)return Response.json({error:"این مبدأ مجاز نیست."},{status:403});
 if(request.method==="POST"&&!allowed)return Response.json({error:"درخواست معتبر نیست."},{status:403});
 const cors={...(allowed?{"Access-Control-Allow-Origin":origin!,"Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Max-Age":"600"}:{}),"Vary":"Origin","Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
 if(request.method==="OPTIONS")return new Response(null,{status:allowed?204:403,headers:cors});
 let response:Response;
 if(url.pathname==="/api/health"&&request.method==="GET")response=await handle(async()=>{await env.DB.prepare("SELECT attendance FROM members LIMIT 1").all();await env.DB.prepare("SELECT id FROM comments LIMIT 1").all();return {ok:true};});
 else if(url.pathname==="/api/events"&&request.method==="POST")response=await handle(()=>createEvent(request));
 else {const match=url.pathname.match(/^\/api\/events\/([a-f0-9]{32})(\/actions)?$/);if(match&&request.method==="GET"&&!match[2])response=await handle(()=>readEvent(request,match[1]));else if(match&&request.method==="POST"&&match[2])response=await handle(()=>act(request,match[1]));else response=Response.json({error:"پیدا نشد."},{status:404});}
 const headers=new Headers(response.headers);for(const[k,v]of Object.entries(cors))headers.set(k,v);return new Response(response.body,{status:response.status,headers});
}};
