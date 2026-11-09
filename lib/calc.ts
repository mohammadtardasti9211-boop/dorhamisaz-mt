import type {Expense,Member} from "./types";
export function balances(members:Member[],expenses:Expense[]){
 const values=members.map(m=>({...m,paid:0,share:0,balance:0})),byId=new Map(values.map(m=>[m.id,m]));
 for(const e of expenses){const payer=byId.get(e.payerId);if(payer)payer.paid+=e.amount;const ids=[...e.participantIds].sort();if(!ids.length)continue;const q=Math.floor(e.amount/ids.length),remainder=e.amount%ids.length;ids.forEach((id,i)=>{const m=byId.get(id);if(m)m.share+=q+(i<remainder?1:0);});}
 values.forEach(m=>m.balance=m.paid-m.share);
 const creditors=values.filter(m=>m.balance>0).map(m=>({id:m.id,left:m.balance})),debtors=values.filter(m=>m.balance<0).map(m=>({id:m.id,left:-m.balance}));
 const settlements:{from:string;to:string;amount:number}[]=[];let a=0,b=0;while(a<debtors.length&&b<creditors.length){const amount=Math.min(debtors[a].left,creditors[b].left);settlements.push({from:debtors[a].id,to:creditors[b].id,amount});debtors[a].left-=amount;creditors[b].left-=amount;if(!debtors[a].left)a++;if(!creditors[b].left)b++;}return{members:values,settlements,total:expenses.reduce((n,e)=>n+e.amount,0)};
}
export const fa=(n:number|string)=>String(n).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
export const english=(s:string)=>s.replace(/[۰-۹٠-٩]/g,d=>String(d.charCodeAt(0)-(d<="٩"?1632:1776)));
export const currency=(n:number)=>new Intl.NumberFormat("fa-IR").format(n);
export const localISO=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export function dateFromISO(s:string){return new Date(s+"T12:00:00");}
export const dateLabel=(s:string,weekday=true)=>new Intl.DateTimeFormat("fa-IR",{...(weekday?{weekday:"long"}:{}),day:"numeric",month:"long"}).format(dateFromISO(s));
export function firstPersianDay(d:Date){const day=Number(new Intl.DateTimeFormat("en-US-u-ca-persian",{day:"numeric"}).format(d));return new Date(d.getFullYear(),d.getMonth(),d.getDate()-day+1,12);}
export function calendarMonth(start:Date){const first=firstPersianDay(start),next=firstPersianDay(new Date(first.getFullYear(),first.getMonth(),first.getDate()+35,12));const count=Math.round((next.getTime()-first.getTime())/86400000);return{first,next,count,offset:(first.getDay()+1)%7};}
export function calendarFile(title:string,date:string,time:string,place:string,link:string){const escape=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");const start=new Date(`${date}T${time}:00+03:30`),end=new Date(start.getTime()+7200000),stamp=(d:Date)=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");return["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Dorhamisaz//FA","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${link.split('/').pop()}@dorhamisaz`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${escape(title)}`,`LOCATION:${escape(place)}`,`DESCRIPTION:${escape(link)}`,"END:VEVENT","END:VCALENDAR",""].join("\r\n");}
