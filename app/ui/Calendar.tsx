"use client";
import {useState} from "react";
import {ChevronLeft,ChevronRight} from "lucide-react";
import {calendarMonth,dateFromISO,fa,firstPersianDay,localISO} from "@/lib/calc";
export default function Calendar({value,onChange}:{value:string;onChange:(s:string)=>void}){
 const[month,setMonth]=useState(()=>firstPersianDay(dateFromISO(value)));const{first,next,count,offset}=calendarMonth(month),today=localISO(new Date());
 return <div className="jalali-calendar"><div className="calendar-toolbar"><button type="button" className="icon-btn" aria-label="ماه قبل" onClick={()=>setMonth(firstPersianDay(new Date(first.getFullYear(),first.getMonth(),first.getDate()-1,12)))}><ChevronRight size={18}/></button><strong>{new Intl.DateTimeFormat("fa-IR",{month:"long",year:"numeric"}).format(first)}</strong><button type="button" className="icon-btn" aria-label="ماه بعد" onClick={()=>setMonth(next)}><ChevronLeft size={18}/></button></div><div className="calendar-grid">{["ش","ی","د","س","چ","پ","ج"].map((x,i)=><span className="weekday" key={i}>{x}</span>)}{Array.from({length:offset},(_,i)=><span key={`empty${i}`}/>)}{Array.from({length:count},(_,i)=>{const d=new Date(first.getFullYear(),first.getMonth(),first.getDate()+i,12),s=localISO(d);return <button key={s} type="button" aria-pressed={s===value} className={`calendar-day ${s===value?"selected":""} ${s===today?"today":""}`} onClick={()=>onChange(s)}>{fa(i+1)}</button>;})}</div></div>;
}
