import type {EventKind} from "./types";
export type Saved={id:string;title:string;kind:EventKind;token?:string};
export function saved():Saved[]{try{return JSON.parse(localStorage.getItem("dh:events")||"[]").filter((x:any)=>/^[a-f0-9]{32}$/.test(x.id)).slice(0,60);}catch{return[];}}
export function remember(event:Saved){const list=saved(),old=list.find(e=>e.id===event.id);localStorage.setItem("dh:events",JSON.stringify([{...old,...event},...list.filter(e=>e.id!==event.id)].slice(0,60)));}
export function forget(id:string){localStorage.setItem("dh:events",JSON.stringify(saved().filter(e=>e.id!==id)));}
export const tokenFor=(id:string)=>saved().find(e=>e.id===id)?.token;
export async function api(path:string,data?:unknown,token?:string){const base=import.meta.env.VITE_API_BASE_URL?.replace(/\/$/,"");if(!base)throw new Error("سرویس دورهمی هنوز راه‌اندازی نشده است.");const res=await fetch(base+path,{method:data?"POST":"GET",headers:{...(data?{"Content-Type":"application/json"}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(data?{body:JSON.stringify(data)}:{}),cache:"no-store"});let result:any;try{result=await res.json();}catch{throw new Error("پاسخ سرویس دریافت نشد؛ دوباره تلاش کن.");}if(!res.ok)throw new Error(result.error||"درخواست انجام نشد.");return result;}
export const kinds:{id:EventKind;label:string;emoji:string;color:string;description:string}[]=[
 {id:"cafe",label:"کافه و گپ",emoji:"☕",color:"peach",description:"یه فنجون، کلی حرف نگفته"},
 {id:"picnic",label:"پیک‌نیک",emoji:"🌿",color:"mint",description:"یه نفس تازه، کنار هم"},
 {id:"game",label:"شب بازی",emoji:"🎲",color:"lavender",description:"رقابت رفاقتی تا آخر شب"},
 {id:"party",label:"جشن و مهمونی",emoji:"🎉",color:"butter",description:"هر بهونه‌ای، بهونهٔ خوبیه"},
];
export const kindInfo=(id:EventKind)=>kinds.find(x=>x.id===id)||kinds[0];
export async function copyText(s:string){if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(s);return;}const e=document.createElement("textarea");e.value=s;e.style.position="fixed";e.style.opacity="0";document.body.appendChild(e);e.select();const ok=document.execCommand("copy");e.remove();if(!ok)throw new Error("لینک را از کادر کپی کن.");}
export function download(name:string,contents:string,type:string){const url=URL.createObjectURL(new Blob([contents],{type})),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
