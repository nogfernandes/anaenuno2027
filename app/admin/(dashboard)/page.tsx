import { createClient } from "@/lib/supabase/server";

type Guest={attendance:string;category:string};
type Invitation={event_type:string;guests:Guest[]};

const events=[
  {type:'pre_event',date:'18.10.2026',name:'Registry office'},
  {type:'wedding',date:'24.04.2027',name:'Wedding'},
] as const;

const count=(guests:Guest[],attendance:string,category?:string)=>guests.filter(guest=>guest.attendance===attendance&&(!category||guest.category===category)).length;

export default async function Dashboard(){
  const s=await createClient();
  const {data}=await s.from('invitations').select('event_type,guests(attendance,category)');
  const invitations=(data??[]) as Invitation[];

  return <>
    <p className="eyebrow">Overview</p>
    <h1 className="font-editorial my-6 text-6xl">Dashboard</h1>
    <p className="mb-8 max-w-2xl text-lg leading-6 opacity-70">Guest response totals for each event. The attendee breakdown includes confirmed guests only.</p>
    <div className="grid gap-8 xl:grid-cols-2">{events.map(event=>{
      const guests=invitations.filter(invitation=>invitation.event_type===event.type).flatMap(invitation=>invitation.guests);
      const summary=[['Total guests',guests.length],['Confirmed',count(guests,'accepted')],['Pending',count(guests,'pending')],['Declined',count(guests,'declined')]] as const;
      const confirmed=[['Adults',count(guests,'accepted','adult')],['Children',count(guests,'accepted','child')],['Babies',count(guests,'accepted','baby')]] as const;

      return <section className="overflow-hidden border border-black/10 bg-[#f8f4ed]" key={event.type}>
        <header className="border-b border-black/10 px-6 py-6 sm:px-8">
          <p className="text-sm uppercase tracking-[.2em] opacity-60">{event.date}</p>
          <h2 className="font-editorial mt-2 text-4xl sm:text-5xl">{event.name}</h2>
        </header>
        <div className="grid grid-cols-2">{summary.map(([label,value],index)=><div className={`min-w-0 border-black/10 p-5 sm:p-6 ${index%2?'border-l':''} ${index>1?'border-t':''}`} key={label}>
          <p className="text-sm uppercase tracking-widest opacity-65">{label}</p>
          <p className="font-editorial mt-4 text-5xl sm:text-6xl">{value}</p>
        </div>)}</div>
        <div className="border-t border-black/10 px-6 py-6 sm:px-8">
          <p className="text-sm uppercase tracking-[.2em] opacity-60">Confirmed guests</p>
          <div className="mt-5 grid grid-cols-3 divide-x divide-black/10">{confirmed.map(([label,value])=><div className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-5" key={label}>
            <p className="font-editorial text-4xl sm:text-5xl">{value}</p>
            <p className="mt-2 truncate text-sm uppercase tracking-wider opacity-65" title={label}>{label}</p>
          </div>)}</div>
        </div>
      </section>;
    })}</div>
  </>;
}
