"use client";
import {useEffect,useState} from "react";
import {Check,Users} from "lucide-react";
import type {EventData} from "@/lib/types";
import type {Perform} from "./Workspace";
import {Avatar,Busy,Field} from "./Common";
import {fa} from "@/lib/calc";
const statuses={pending:"هنوز اعلام نکرده",yes:"میام",maybe:"شاید بیام",no:"نمیام"};
export default function Attendance({data,busy,perform}:{data:EventData;busy:boolean;perform:Perform}){
 const[name,setName]=useState(data.me?.name||""),[status,setStatus]=useState(data.me?.attendance||"pending");
 useEffect(()=>{setName(data.me?.name||"");setStatus(data.me?.attendance||"pending");},[data.me?.name,data.me?.attendance]);
 return <section className="members-card attendance-card"><div className="section-heading"><h3><Users size={19}/>اعلام حضور افراد</h3><span className="count-badge">{fa(data.members.length)}</span></div><div className="attendance-summary">{fa(data.members.filter(m=>m.attendance==="yes").length)} نفر میان · {fa(data.members.filter(m=>m.attendance==="maybe").length)} نفر شاید</div><div className="member-list">{data.members.map((m,i)=><div key={m.id}><Avatar name={m.name} index={i}/><span><b>{m.name}{m.id===data.me?.id&&<small> (شما)</small>}</b><small>{m.role==="host"?"میزبان":"همراه جمع"}</small></span><span className={`attendance-status attendance-${m.attendance}`}>{statuses[m.attendance]}</span></div>)}</div>
 {data.me&&<form className="attendance-form" onSubmit={async e=>{e.preventDefault();if(await perform({action:"rsvp",name,status},"اسم و وضعیت حضورت ثبت شد."))localStorage.setItem("dh:name",name);}}><Field label="نام شما برای اعلام حضور"><input required maxLength={40} value={name} onChange={e=>setName(e.target.value)}/></Field><div className="rsvp-options" role="group" aria-label="وضعیت حضور شما">{(["yes","maybe","no"] as const).map(value=><button type="button" key={value} aria-pressed={status===value} className={status===value?"selected":""} disabled={busy} onClick={()=>setStatus(value)}>{statuses[value]}</button>)}</div><button className="btn btn-green full" disabled={busy||status==="pending"}>{busy?<Busy/>:<><Check size={16}/>ثبت حضور من</>}</button></form>}
 </section>;
}
