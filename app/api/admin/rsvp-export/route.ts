import { createClient } from "@/lib/supabase/server";

type EventType='wedding'|'pre_event';
type Option={value:string;label_pt:string;label_en:string};
type Question={id:string;label_pt:string;label_en:string;question_type:string;scope:string;options:Option[]};
type Answer={invitation_id:string;guest_id:string|null;question_id:string;answer:unknown};
type Guest={id:string;name:string;category:string;attendance:string;dietary_restrictions:string|null};
type Invitation={id:string;code:string;language:string;status:string;guests:Guest[]};

const eventName=(event:EventType)=>event==='pre_event'?'Cartório · 18.10.2026':'Casamento · 24.04.2027';
const statusLabel:Record<string,string>={active:'Ativo',used:'Respondido',disabled:'Desativado'};
const categoryLabel:Record<string,string>={adult:'Adulto',child:'Criança',baby:'Bebé'};
const attendanceLabel:Record<string,string>={accepted:'Confirmado',pending:'Pendente',declined:'Recusado'};
const answerValues=(answer:unknown)=>Array.isArray(answer)?answer:[answer];
const displayAnswer=(answer:unknown,question:Question)=>answerValues(answer).map(value=>{
  if(typeof value==='boolean')return value?'Sim':'Não';
  return question.options.find(option=>option.value===value)?.label_pt??String(value??'');
}).join(', ');
const csvCell=(value:unknown)=>{
  let text=String(value??'').replace(/\r?\n/g,' ');
  if(/^[=+\-@\t\r]/.test(text))text=`'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
};

export async function GET(request:Request){
  const event:EventType=new URL(request.url).searchParams.get('event')==='pre_event'?'pre_event':'wedding';
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user)return new Response('Unauthorized',{status:401});
  const {data:isAdmin}=await s.rpc('is_admin');
  if(!isAdmin)return new Response('Forbidden',{status:403});

  const [{data:invitationData,error:invitationError},{data:questionData,error:questionError}]=await Promise.all([
    s.from('invitations').select('id,code,language,status,guests(id,name,category,attendance,dietary_restrictions)').eq('event_type',event).order('created_at',{ascending:true}),
    s.from('rsvp_questions').select('id,label_pt,label_en,question_type,scope,options').eq('event_type',event).order('position'),
  ]);
  if(invitationError||questionError)return new Response('Unable to create export',{status:500});
  const invitations=(invitationData??[]) as Invitation[];
  const questions=(questionData??[]) as Question[];
  const invitationIds=invitations.map(invitation=>invitation.id);
  const {data:answerData,error:answerError}=invitationIds.length?await s.from('rsvp_answers').select('invitation_id,guest_id,question_id,answer').in('invitation_id',invitationIds).limit(5000):{data:[],error:null};
  if(answerError)return new Response('Unable to create export',{status:500});
  const answers=(answerData??[]) as Answer[];

  const headers=['Evento','Código do convite','Idioma','Estado do convite','Nome do convidado','Tipo','Presença','Restrições alimentares',...questions.map((question,index)=>`Pergunta ${index+1} — ${question.label_pt||question.label_en}`)];
  const rows=invitations.flatMap(invitation=>invitation.guests.map(guest=>{
    const fixed=[eventName(event),invitation.code,invitation.language.toUpperCase(),statusLabel[invitation.status]??invitation.status,guest.name,categoryLabel[guest.category]??guest.category,attendanceLabel[guest.attendance]??guest.attendance,guest.dietary_restrictions??''];
    const custom=questions.map(question=>{
      const answer=answers.find(item=>item.invitation_id===invitation.id&&item.question_id===question.id&&(question.scope==='guest'?item.guest_id===guest.id:item.guest_id===null));
      return answer?displayAnswer(answer.answer,question):'';
    });
    return [...fixed,...custom];
  }));
  const csv=[headers,...rows].map(row=>row.map(csvCell).join(';')).join('\r\n');
  const filename=event==='pre_event'?'rsvp-respostas-cartorio-2026-10-18.csv':'rsvp-respostas-casamento-2027-04-24.csv';
  return new Response(`\uFEFF${csv}`,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="${filename}"`,'cache-control':'no-store'}});
}
