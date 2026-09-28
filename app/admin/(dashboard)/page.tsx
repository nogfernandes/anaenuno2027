import { createClient } from "@/lib/supabase/server";

type Guest={id:string;name:string;attendance:string;category:string};
type Invitation={id:string;code:string;event_type:string;guests:Guest[]};
type Option={value:string;label_en:string};
type Question={id:string;event_type:string;label_en:string;question_type:string;scope:string;options:Option[];position:number};
type Answer={id:string;invitation_id:string;guest_id:string|null;question_id:string;answer:unknown};

const events=[
  {type:'pre_event',date:'18.10.2026',name:'Registry office'},
  {type:'wedding',date:'24.04.2027',name:'Wedding'},
] as const;

const count=(guests:Guest[],attendance:string,category?:string)=>guests.filter(guest=>guest.attendance===attendance&&(!category||guest.category===category)).length;
const answerValues=(answer:unknown)=>Array.isArray(answer)?answer:[answer];
const displayAnswer=(answer:unknown,question:Question)=>answerValues(answer).map(value=>{
  if(typeof value==='boolean')return value?'Yes':'No';
  return question.options.find(option=>option.value===value)?.label_en??String(value??'');
}).join(', ');
const answerBreakdown=(question:Question,answers:Answer[])=>{
  if(question.question_type==='yes_no')return [{label:'Yes',value:true},{label:'No',value:false}].map(item=>({...item,count:answers.filter(answer=>answer.answer===item.value).length}));
  if(!['single_choice','multiple_choice'].includes(question.question_type))return [];
  return question.options.map(option=>({label:option.label_en,value:option.value,count:answers.filter(answer=>answerValues(answer.answer).includes(option.value)).length}));
};

export default async function Dashboard(){
  const s=await createClient();
  const [{data:invitationData},{data:questionData},{data:answerData}]=await Promise.all([
    s.from('invitations').select('id,code,event_type,guests(id,name,attendance,category)'),
    s.from('rsvp_questions').select('id,event_type,label_en,question_type,scope,options,position').order('position'),
    s.from('rsvp_answers').select('id,invitation_id,guest_id,question_id,answer').limit(5000),
  ]);
  const invitations=(invitationData??[]) as Invitation[];
  const questions=(questionData??[]) as Question[];
  const answers=(answerData??[]) as Answer[];
  const invitationsById=new Map(invitations.map(invitation=>[invitation.id,invitation]));
  const guestsById=new Map(invitations.flatMap(invitation=>invitation.guests.map(guest=>[guest.id,guest] as const)));

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
    <div className="mt-12 space-y-8">{events.map(event=>{
      const eventQuestions=questions.filter(question=>question.event_type===event.type);
      return <section className="border border-black/10 bg-[#f8f4ed]" key={`${event.type}-answers`}>
        <header className="flex flex-col gap-5 border-b border-black/10 px-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div><p className="text-sm uppercase tracking-[.2em] opacity-60">{event.date} · RSVP monitoring</p><h2 className="font-editorial mt-2 text-4xl">Extra question responses</h2></div>
          <a className="button shrink-0 self-start sm:self-auto" href={`/api/admin/rsvp-export?event=${event.type}`}>Export table ↓</a>
        </header>
        {eventQuestions.length?<div className="divide-y divide-black/10">{eventQuestions.map(question=>{
          const submitted=answers.filter(answer=>answer.question_id===question.id);
          const breakdown=answerBreakdown(question,submitted);
          return <details className="group" key={question.id}>
            <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden sm:px-8">
              <span className="min-w-0 flex-1"><span className="block font-editorial text-2xl">{question.label_en}</span><span className="mt-1 block text-sm uppercase tracking-wider opacity-55">{question.scope==='guest'?'Per guest':'Per invitation'}</span></span>
              <span className="shrink-0 text-sm uppercase tracking-widest">{submitted.length} {submitted.length===1?'response':'responses'}</span>
              <span className="shrink-0 text-2xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <div className="border-t border-black/10 px-6 pb-7 pt-6 sm:px-8">
              {breakdown.length>0&&<div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{breakdown.map(item=><div className="border border-black/10 p-4" key={String(item.value)}><p className="truncate text-sm uppercase tracking-wider opacity-60" title={item.label}>{item.label}</p><p className="font-editorial mt-2 text-4xl">{item.count}</p></div>)}</div>}
              {submitted.length?<div className="divide-y divide-black/10 border-y border-black/10">{submitted.map(answer=>{
                const invitation=invitationsById.get(answer.invitation_id);const guest=answer.guest_id?guestsById.get(answer.guest_id):undefined;const respondent=guest?.name??invitation?.guests[0]?.name??'Invitation';
                return <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" key={answer.id}><div className="min-w-0"><p className="truncate font-semibold" title={respondent}>{respondent}</p><p className="mt-1 break-all font-mono text-xs opacity-55">{invitation?.code??'—'}</p></div><p className="min-w-0 whitespace-pre-wrap text-lg leading-6">{displayAnswer(answer.answer,question)}</p></div>;
              })}</div>:<p className="text-lg opacity-60">No responses yet.</p>}
            </div>
          </details>;
        })}</div>:<p className="px-6 py-8 text-lg opacity-60 sm:px-8">No extra questions configured for this event.</p>}
      </section>;
    })}</div>
  </>;
}
