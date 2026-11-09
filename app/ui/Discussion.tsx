"use client";
import {useState} from "react";
import {MessageCircle,Send,Trash2} from "lucide-react";
import type {EventData} from "@/lib/types";
import type {Perform} from "./Workspace";
import {Avatar,Busy,Field} from "./Common";
import {fa} from "@/lib/calc";
const topics={general:"گفت‌وگوی جمع",time:"تغییر زمان و ساعت",place:"تغییر مکان"};
export default function Discussion({data,busy,perform}:{data:EventData;busy:boolean;perform:Perform}){
 const[text,setText]=useState(""),[topic,setTopic]=useState<keyof typeof topics>("general");
 return <section className="discussion-panel"><div className="panel-heading"><span className="discussion-icon"><MessageCircle size={23}/></span><div><h2>حرفِ جمع</h2><p>نظرت دربارهٔ زمان، مکان یا برنامه چیه؟</p></div><span className="count-badge">{fa(data.comments.length)}</span></div>
 <div className="comment-list">{data.comments.length?data.comments.map(c=>{const index=data.members.findIndex(m=>m.id===c.authorId),author=data.members[index];return <article className="comment" key={c.id}><Avatar name={author?.name||"همراه جمع"} index={Math.max(0,index)}/><div className="comment-content"><div className="comment-meta"><b>{author?.name||"همراه جمع"}</b><time dateTime={new Date(c.createdAt).toISOString()}>{new Intl.DateTimeFormat("fa-IR",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Tehran"}).format(c.createdAt)}</time></div><span className="comment-topic">{topics[c.topic]}</span><p>{c.body}</p></div>{data.me&&(data.me.role==="host"||data.me.id===c.authorId)&&<button className="icon-btn" aria-label={`حذف نظر ${author?.name||"همراه جمع"}`} disabled={busy} onClick={()=>perform({action:"deleteComment",commentId:c.id},"نظر حذف شد.")}><Trash2 size={15}/></button>}</article>;}):<div className="discussion-empty"><MessageCircle size={26}/><p>اولین نظر رو تو بنویس؛ قرار خوب از گفت‌وگو شروع می‌شه.</p></div>}</div>
 {data.me?<form className="comment-form" onSubmit={async e=>{e.preventDefault();if(await perform({action:"addComment",text,topic},"نظرت برای جمع ثبت شد."))setText("");}}><div className="comment-writing-as">با نام <b>{data.me.name}</b> می‌نویسی</div><Field label="موضوع نظر"><select value={topic} onChange={e=>setTopic(e.target.value as keyof typeof topics)}>{Object.entries(topics).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></Field><Field label="نظر یا پیشنهاد شما"><textarea required rows={3} maxLength={1200} placeholder="مثلاً ساعت ۷ برام مناسب‌تره؛ می‌تونیم مکان رو هم نزدیک‌تر انتخاب کنیم؟" value={text} onChange={e=>setText(e.target.value)}/></Field><div className="comment-form-bottom"><small>{fa(text.length)} / ۱۲۰۰</small><button className="btn btn-green" disabled={busy||!text.trim()}>{busy?<Busy/>:<><Send size={16}/>ثبت نظر</>}</button></div></form>:<p className="discussion-join-note">برای نوشتن نظر، بالای صفحه اسمت رو بنویس و به جمع بپیوند.</p>}
 </section>;
}
