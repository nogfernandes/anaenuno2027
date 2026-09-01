import Link from "next/link";

export type AdminEventType="wedding"|"pre_event";

export function EventTabs({base,current}:{base:string;current:AdminEventType}){
  return <nav className="mb-8 flex flex-wrap gap-3" aria-label="Event selection">
    <Link className={`button ${current==='wedding'?'bg-[#392f29] text-[#f4efe7]':''}`} href={`${base}?event=wedding`}>Wedding · 24.04.2027</Link>
    <Link className={`button ${current==='pre_event'?'bg-[#392f29] text-[#f4efe7]':''}`} href={`${base}?event=pre_event`}>Pre-event · 18.10.2026</Link>
  </nav>;
}

export const selectedEvent=(raw?:string):AdminEventType=>raw==='pre_event'?'pre_event':'wedding';
