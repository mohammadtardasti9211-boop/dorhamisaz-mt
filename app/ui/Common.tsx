"use client";
import {useEffect,useId,useRef} from "react";
import {X,LoaderCircle} from "lucide-react";
import type {Member} from "@/lib/types";
export type Notify=(text:string,error?:boolean)=>void;
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}){const ref=useRef<HTMLDialogElement>(null),id=useId();useEffect(()=>{ref.current?.showModal();const previous=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=previous;};},[]);return <dialog ref={ref} className={`modal ${wide?"modal-wide":""}`} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}}><div className="modal-content"><div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-btn" aria-label="بستن" onClick={onClose}><X size={21}/></button></div>{children}</div></dialog>;}
export function Field({label,children,hint}:{label:string;children:React.ReactNode;hint?:string}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function Busy(){return <LoaderCircle size={19} className="spin" aria-label="در حال انجام"/>;}
const colors=["#803442","#4c435a","#6a343b","#55535c","#593442","#6b4a4e"];
export function Avatar({name,index=0,small=false}:{name:string;index?:number;small?:boolean}){return <span className={`avatar ${small?"avatar-small":""}`} style={{background:colors[index%colors.length]}} title={name}>{name.trim()[0]}</span>;}
export function AvatarGroup({members}:{members:Member[]}){return <span className="avatar-group">{members.slice(0,5).map((m,i)=><Avatar key={m.id} name={m.name} index={i} small/>)}{members.length>5&&<span className="avatar-more">+{members.length-5}</span>}</span>;}
