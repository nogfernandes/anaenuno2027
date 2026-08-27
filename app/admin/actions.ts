"use server";
import { redirect } from "next/navigation"; import { revalidatePath } from "next/cache"; import { createClient } from "@/lib/supabase/server";
export async function login(formData:FormData){const supabase=await createClient();const {error}=await supabase.auth.signInWithPassword({email:String(formData.get('email')||''),password:String(formData.get('password')||'')});if(error)redirect('/admin/login?error=1');const {data:isAdmin}=await supabase.rpc('is_admin');if(!isAdmin){await supabase.auth.signOut();redirect('/admin/login?unauthorized=1')}redirect('/admin')}
export async function logout(){const supabase=await createClient();await supabase.auth.signOut();redirect('/')}
export async function saveSettings(formData:FormData){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/admin/login');await supabase.from('wedding_settings').upsert({id:1,rsvp_open:formData.get('rsvp_open')==='on',rsvp_deadline:formData.get('rsvp_deadline'),show_faq:formData.get('show_faq')==='on',show_dress_code:formData.get('show_dress_code')==='on',show_playlist:formData.get('show_playlist')==='on',show_programme:formData.get('show_programme')==='on'});revalidatePath('/admin/settings')}
async function requireAdmin(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/admin/login');const {data:isAdmin}=await supabase.rpc('is_admin');if(!isAdmin)redirect('/admin/login?unauthorized=1');return supabase}
export async function createInvitation(formData:FormData){const supabase=await requireAdmin();const names=String(formData.get('guest_names')||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,4);if(!names.length)return;const supplied=String(formData.get('code')||'').trim().toUpperCase();const code=supplied||`ANA-NUNO-2027-${crypto.randomUUID().slice(0,4).toUpperCase()}`;await supabase.rpc('admin_create_invitation',{invitation_code:code,invitation_language:formData.get('language')==='en'?'en':'pt',guest_names:names});revalidatePath('/admin');revalidatePath('/admin/invitations');revalidatePath('/admin/guests')}
export async function updateInvitationStatus(formData:FormData){const supabase=await requireAdmin();const id=String(formData.get('id')||'');const status=String(formData.get('status')||'');if(!['active','used','disabled'].includes(status))return;await supabase.from('invitations').update({status}).eq('id',id);revalidatePath('/admin/invitations')}
export async function updateGuest(formData:FormData){const supabase=await requireAdmin();const id=String(formData.get('id')||'');const category=String(formData.get('category')||'adult');const attendance=String(formData.get('attendance')||'pending');if(!['adult','child','baby'].includes(category)||!['pending','accepted','declined'].includes(attendance))return;await supabase.from('guests').update({category,attendance,dietary_restrictions:String(formData.get('dietary_restrictions')||'').trim()||null,notes:String(formData.get('notes')||'').trim()||null,updated_at:new Date().toISOString()}).eq('id',id);revalidatePath('/admin');revalidatePath('/admin/guests')}

const value=(formData:FormData,key:string)=>String(formData.get(key)||'').trim();
const optional=(formData:FormData,key:string)=>value(formData,key)||null;

export async function saveContent(formData:FormData){
  const supabase=await requireAdmin();
  const fields=['city_pt','city_en','story_pt','story_en','dress_title_pt','dress_title_en','dress_text_pt','dress_text_en','rsvp_intro_pt','rsvp_intro_en','playlist_prompt_pt','playlist_prompt_en','message_prompt_pt','message_prompt_en','footer_pt','footer_en'];
  const content=Object.fromEntries(fields.map(key=>[key,value(formData,key)]));
  await supabase.from('site_content').upsert({id:1,...content,updated_at:new Date().toISOString()});
  revalidatePath('/');revalidatePath('/rsvp');revalidatePath('/admin/content');
}

export async function saveEvent(formData:FormData){
  const supabase=await requireAdmin();const id=value(formData,'id');
  const event={title_pt:value(formData,'title_pt'),title_en:value(formData,'title_en'),description_pt:optional(formData,'description_pt'),description_en:optional(formData,'description_en'),event_date:value(formData,'event_date'),start_time:optional(formData,'start_time'),end_time:optional(formData,'end_time'),venue:optional(formData,'venue'),address:optional(formData,'address'),maps_url:optional(formData,'maps_url'),position:Number(value(formData,'position')||0),is_active:formData.get('is_active')==='on',updated_at:new Date().toISOString()};
  if(id)await supabase.from('event_details').update(event).eq('id',id);else await supabase.from('event_details').insert(event);
  revalidatePath('/');revalidatePath('/admin/content');
}

export async function deleteEvent(formData:FormData){const supabase=await requireAdmin();await supabase.from('event_details').delete().eq('id',value(formData,'id'));revalidatePath('/');revalidatePath('/admin/content')}

export async function saveFaq(formData:FormData){
  const supabase=await requireAdmin();const id=value(formData,'id');
  const faq={question_pt:value(formData,'question_pt'),question_en:value(formData,'question_en'),answer_pt:value(formData,'answer_pt'),answer_en:value(formData,'answer_en'),position:Number(value(formData,'position')||0),is_active:formData.get('is_active')==='on',updated_at:new Date().toISOString()};
  if(id)await supabase.from('faqs').update(faq).eq('id',id);else await supabase.from('faqs').insert(faq);
  revalidatePath('/');revalidatePath('/admin/content');
}

export async function deleteFaq(formData:FormData){const supabase=await requireAdmin();await supabase.from('faqs').delete().eq('id',value(formData,'id'));revalidatePath('/');revalidatePath('/admin/content')}

export async function saveQuestion(formData:FormData){
  const supabase=await requireAdmin();const id=value(formData,'id');
  const pt=value(formData,'options_pt').split('\n').map(x=>x.trim()).filter(Boolean);const en=value(formData,'options_en').split('\n').map(x=>x.trim()).filter(Boolean);
  const options=pt.map((label_pt,index)=>({label_pt,label_en:en[index]||label_pt,value:`option_${index+1}`}));
  const question={label_pt:value(formData,'label_pt'),label_en:value(formData,'label_en'),help_pt:optional(formData,'help_pt'),help_en:optional(formData,'help_en'),question_type:value(formData,'question_type'),scope:value(formData,'scope'),options,required:formData.get('required')==='on',is_active:formData.get('is_active')==='on',position:Number(value(formData,'position')||0),updated_at:new Date().toISOString()};
  if(id)await supabase.from('rsvp_questions').update(question).eq('id',id);else await supabase.from('rsvp_questions').insert(question);
  revalidatePath('/rsvp');revalidatePath('/admin/questions');
}

export async function deleteQuestion(formData:FormData){const supabase=await requireAdmin();await supabase.from('rsvp_questions').delete().eq('id',value(formData,'id'));revalidatePath('/rsvp');revalidatePath('/admin/questions')}
