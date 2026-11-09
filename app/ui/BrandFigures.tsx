import {assetURL} from "@/lib/routes";
import {CalendarDays,Check,MapPin,Sparkles,Users} from "lucide-react";

export function FullBody({className="",decorative=false,eager=false}:{className?:string;decorative?:boolean;eager?:boolean}){
 return <span className={`fullbody-portrait ${className}`} aria-hidden={decorative||undefined}><img src={assetURL("mohammad-casual.webp")} width={1024} height={1536} alt={decorative?"":"محمد تردستی، تمام‌قد، خندان با لباس تفریحی"} loading={eager?"eager":"lazy"} decoding="async" draggable={false}/></span>;
}

export function HeroFigure(){return <div className="hero-figure-stage"><span className="figure-orbit orbit-one"/><span className="figure-orbit orbit-two"/><span className="figure-halo"/><span className="figure-topline">کنار هم، به سبک خودمون</span><FullBody className="hero-person" eager/><div className="figure-chip chip-time"><span><CalendarDays size={18}/></span><div><b>قرارمون جور شد!</b><small>با رأی همهٔ جمع</small></div><Check size={15}/></div><div className="figure-chip chip-place"><MapPin size={16}/><span>همین‌جا، کنار رفقا</span></div><div className="figure-nameplate"><span/><div><b>محمد تردستی</b><small>همراهِ قرارهای خاطره‌ساز</small></div><Sparkles size={18}/></div><span className="figure-floor"/></div>;}

export function TemplateScene({kind,label}:{kind:string;label:string}){return <span className="template-photo"><img src={assetURL(`gathering-${kind}.webp`)} width={1536} height={1024} alt={`${label} با حضور محمد تردستی و دوستان`} loading="lazy" decoding="async"/></span>;}

export function BrandGuide(){return <div className="brand-guide"><FullBody className="guide-person" decorative/><div><span className="guide-label"><Users size={15}/>کنار هم، با محمد</span><h3>هر قرار،<br/>یه خاطرهٔ تازه.</h3><span className="guide-signature">محمد تردستی</span></div></div>;}

export function SuitPortrait(){return <span className="suit-portrait"><img src={assetURL("mohammad-casual.webp")} width={1024} height={1536} alt="نیم‌تنهٔ محمد تردستی با لباس تفریحی" loading="lazy" decoding="async" draggable={false}/></span>;}
