import { createClient } from "@/lib/supabase/server";
import { EventTabs,selectedEvent } from "@/components/admin/event-tabs";
import { addGuest,removeGuest,updateGuest } from "../../actions";

type Option={value:string;label_en:string};
type Answer={id:string;guest_id:string|null;invitation_id:string;answer:unknown;rsvp_questions:{label_en:string;options:Option[]}|null};
type Guest={id:string;invitation_id:string;name:string;category:string;attendance:string;dietary_restrictions:string|null;notes:string|null;invitations:{code:string}|null};
type Invitation={id:string;code:string;max_guests:number;status:string;created_at:string};
const displayAnswer=(answer:unknown,options:Option[]=[])=>{if(typeof answer==='boolean')return answer?'Yes':'No';const values=Array.isArray(answer)?answer:[answer];return values.map(value=>options.find(option=>option.value===value)?.label_en??String(value??'')).join(', ')};

export default async function Guests({searchParams}:{searchParams:Promise<{event?:string}>}){
  const eventType=selectedEvent((await searchParams).event);const s=await createClient();const {data:invitationData}=await s.from('invitations').select('id,code,max_guests,status,created_at').eq('event_type',eventType).order('created_at',{ascending:true});const invitations=(invitationData??[]) as Invitation[];const invitationIds=invitations.map(invitation=>invitation.id);const [{data:guestData},{data:answerData}]=invitationIds.length?await Promise.all([s.from('guests').select('id,invitation_id,name,category,attendance,dietary_restrictions,notes,invitations(code)').in('invitation_id',invitationIds).order('name'),s.from('rsvp_answers').select('id,guest_id,invitation_id,answer,rsvp_questions(label_en,options)').in('invitation_id',invitationIds)]):[{data:[]},{data:[]}];
  const guests=(guestData??[]) as unknown as Guest[];const answers=(answerData??[]) as unknown as Answer[];const available=invitations.filter(invitation=>invitation.status!=='disabled'&&invitation.max_guests<5);const guestGroups=invitations.map(invitation=>({invitation,guests:guests.filter(guest=>guest.invitation_id===invitation.id)})).filter(group=>group.guests.length>0);
  return <><p className="eyebrow">Everyone</p><h1 className="font-editorial my-6 text-6xl">Guests + answers</h1><EventTabs base="/admin/guests" current={eventType}/><p className="mb-8 max-w-xl text-lg leading-6 opacity-70">Rename, add or remove participants, update RSVP details and review their submitted answers.</p>
    <details className="mb-8 bg-[#f8f4ed] p-6"><summary className="cursor-pointer font-editorial text-3xl">Add guest <span className="float-right">+</span></summary>{available.length?<form action={addGuest} className="mt-6 grid gap-5 sm:grid-cols-3"><input type="hidden" name="event_type" value={eventType}/><label className="text-sm uppercase tracking-widest">Invitation<select className="field" name="invitation_id" required>{available.map(invitation=><option value={invitation.id} key={invitation.id}>{invitation.code} · {invitation.max_guests}/5</option>)}</select></label><label className="text-sm uppercase tracking-widest">Guest name<input className="field" name="name" maxLength={150} required/></label><label className="text-sm uppercase tracking-widest">Guest type<select className="field" name="category"><option value="adult">Adult</option><option value="child">Child</option><option value="baby">Baby</option></select></label><button className="button sm:col-span-3 sm:justify-self-start">Add guest</button></form>:<p className="mt-5 text-lg opacity-70">Every active invitation already has five guests.</p>}</details>
    <div className="grid gap-4">{guestGroups.map(group=><section className="bg-[#f8f4ed]" key={group.invitation.id}>
      <div className="border-b border-black/10 px-5 py-3">
        <p className="break-all font-mono text-xs font-semibold uppercase tracking-[.08em] sm:text-sm">{group.invitation.code}</p>
      </div>
      <div className="divide-y divide-black/10">{group.guests.map(g=>{
      const submitted=answers.filter(a=>a.guest_id===g.id||(a.guest_id===null&&a.invitation_id===g.invitation_id));
      const attendanceLabel=g.attendance==='accepted'?'Accepted':g.attendance==='declined'?'Declined':'Pending';
      const attendanceClass=g.attendance==='accepted'?'bg-[#5d6250] text-white':g.attendance==='declined'?'bg-[#b65f41] text-white':'bg-[#d9c7ad] text-[#392f29]';
      return <details className="group" key={g.id}>
        <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 truncate font-editorial text-2xl">{g.name}</span>
          <span className={`shrink-0 px-3 py-1 text-sm uppercase tracking-widest ${attendanceClass}`}>{attendanceLabel}</span>
          <span className="shrink-0 text-2xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
        <form action={updateGuest} className="border-t border-black/10 px-6 pb-6 pt-5">
          <input type="hidden" name="id" value={g.id}/><input type="hidden" name="event_type" value={eventType}/>
          <label className="block text-sm uppercase tracking-widest">Guest name<input className="field font-editorial text-3xl normal-case tracking-normal" name="name" defaultValue={g.name} maxLength={150} required/></label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm uppercase tracking-widest">Guest type<select className="field" name="category" defaultValue={g.category}><option value="adult">Adult</option><option value="child">Child</option><option value="baby">Baby</option></select></label><label className="text-sm uppercase tracking-widest">Attendance<select className="field" name="attendance" defaultValue={g.attendance}><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></label><label className="text-sm uppercase tracking-widest sm:col-span-2">Dietary restrictions<input className="field" name="dietary_restrictions" defaultValue={g.dietary_restrictions??''}/></label><label className="text-sm uppercase tracking-widest sm:col-span-2">Private notes<textarea className="field min-h-20" name="notes" defaultValue={g.notes??''}/></label></div>
          {submitted.length>0&&<div className="mt-7 border-t border-black/10 pt-5"><p className="eyebrow mb-4">Submitted answers</p><dl className="space-y-4">{submitted.map(a=><div key={a.id}><dt className="text-base font-semibold">{a.rsvp_questions?.label_en}</dt><dd className="mt-1 text-lg opacity-70">{displayAnswer(a.answer,a.rsvp_questions?.options)}</dd></div>)}</dl></div>}
          <div className="mt-6 flex flex-wrap gap-3"><button className="button">Save guest</button><button className="button text-red-800" formAction={removeGuest}>Remove guest</button></div>
        </form>
      </details>
      })}</div>
    </section>)}</div>
  </>;
}
