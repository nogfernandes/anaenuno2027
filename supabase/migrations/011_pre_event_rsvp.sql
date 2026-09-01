alter table public.invitations
  add column if not exists event_type text not null default 'wedding'
  check (event_type in ('wedding','pre_event'));

alter table public.rsvp_questions
  add column if not exists event_type text not null default 'wedding'
  check (event_type in ('wedding','pre_event'));

alter table public.wedding_settings
  add column if not exists show_pre_event boolean not null default false,
  add column if not exists pre_event_rsvp_open boolean not null default true,
  add column if not exists pre_event_rsvp_deadline date not null default '2026-10-04';

alter table public.site_content
  add column if not exists pre_event_title_pt text not null default 'Pré-evento',
  add column if not exists pre_event_title_en text not null default 'Pre-event',
  add column if not exists pre_event_text_pt text not null default 'Gostávamos de começar a celebrar convosco antes do grande dia.',
  add column if not exists pre_event_text_en text not null default 'We would love to start celebrating with you before the big day.',
  add column if not exists pre_event_venue_pt text not null default 'Local a confirmar',
  add column if not exists pre_event_venue_en text not null default 'Venue to be confirmed',
  add column if not exists pre_event_address_pt text not null default 'Morada a confirmar',
  add column if not exists pre_event_address_en text not null default 'Address to be confirmed',
  add column if not exists pre_event_time_pt text not null default 'Hora a confirmar',
  add column if not exists pre_event_time_en text not null default 'Time to be confirmed',
  add column if not exists pre_event_rsvp_intro_pt text not null default 'Usa o código único do convite do pré-evento.',
  add column if not exists pre_event_rsvp_intro_en text not null default 'Use the unique code from your pre-event invitation.';

create index if not exists invitations_event_type_created_at_idx
  on public.invitations(event_type, created_at);
create index if not exists rsvp_questions_event_type_position_idx
  on public.rsvp_questions(event_type, position);

drop function if exists public.admin_create_invitation(text,text,text[]);
create function public.admin_create_invitation(
  invitation_code text,
  invitation_language text,
  guest_names text[],
  p_event_type text default 'wedding'
) returns uuid
language plpgsql security definer set search_path=public as $$
declare new_id uuid; guest_name text;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if invitation_language not in ('pt','en') then raise exception 'Invalid language'; end if;
  if p_event_type not in ('wedding','pre_event') then raise exception 'Invalid event type'; end if;
  if coalesce(array_length(guest_names,1),0) not between 1 and 5 then raise exception 'Invitations require 1 to 5 guests'; end if;
  insert into invitations(code,language,max_guests,status,event_type)
  values(upper(trim(invitation_code)),invitation_language,array_length(guest_names,1),'active',p_event_type)
  returning id into new_id;
  foreach guest_name in array guest_names loop
    if nullif(trim(guest_name),'') is not null then
      insert into guests(invitation_id,name) values(new_id,left(trim(guest_name),150));
    end if;
  end loop;
  return new_id;
end $$;

drop function if exists public.admin_import_invitations(jsonb);
create function public.admin_import_invitations(p_rows jsonb, p_event_type text default 'wedding') returns integer
language plpgsql security definer set search_path=public as $$
declare row_item jsonb; guest_item jsonb; new_id uuid; guest_count integer; imported integer:=0;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if p_event_type not in ('wedding','pre_event') then raise exception 'Invalid event type'; end if;
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)=0 then raise exception 'The import has no invitations'; end if;
  if jsonb_array_length(p_rows)>500 then raise exception 'Imports are limited to 500 invitations at a time'; end if;
  for row_item in select * from jsonb_array_elements(p_rows) loop
    if row_item->>'language' not in ('pt','en') then raise exception 'Every row needs language pt or en'; end if;
    guest_count:=jsonb_array_length(coalesce(row_item->'guests','[]'::jsonb));
    if guest_count not between 1 and 5 then raise exception 'Every invitation requires 1 to 5 guests'; end if;
    insert into invitations(code,language,max_guests,status,event_type)
    values(upper(row_item->>'code'),row_item->>'language',guest_count,'active',p_event_type)
    returning id into new_id;
    for guest_item in select * from jsonb_array_elements(row_item->'guests') loop
      if nullif(trim(guest_item->>'name'),'') is null then raise exception 'Guest names cannot be empty'; end if;
      if coalesce(guest_item->>'category','adult') not in ('adult','child','baby') then raise exception 'Guest type must be adult, child or baby'; end if;
      insert into guests(invitation_id,name,category)
      values(new_id,left(trim(guest_item->>'name'),150),coalesce(guest_item->>'category','adult'));
    end loop;
    imported:=imported+1;
  end loop;
  return imported;
end $$;

create or replace function public.lookup_invitation(invitation_code text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb; inv_type text;
begin
  select event_type into inv_type from invitations
  where upper(code)=upper(invitation_code) and status<>'disabled';
  if inv_type is null then return null; end if;
  if inv_type='pre_event' then
    if not coalesce((select pre_event_rsvp_open from wedding_settings where id=1),true) then raise exception 'RSVP closed'; end if;
  elsif not coalesce((select rsvp_open from wedding_settings where id=1),true) then
    raise exception 'RSVP closed';
  end if;
  select jsonb_build_object(
    'id',i.id,'code',i.code,'language',i.language,'max_guests',i.max_guests,'status',i.status,'event_type',i.event_type,
    'guests',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'category',g.category,'attendance',g.attendance,'dietary_restrictions',g.dietary_restrictions,'notes',g.notes) order by g.name) from guests g where g.invitation_id=i.id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'label_pt',q.label_pt,'label_en',q.label_en,'help_pt',q.help_pt,'help_en',q.help_en,'question_type',q.question_type,'scope',q.scope,'options',q.options,'required',q.required,'position',q.position) order by q.position,q.created_at) from rsvp_questions q where q.is_active and q.event_type=i.event_type),'[]'::jsonb),
    'answers',coalesce((select jsonb_agg(jsonb_build_object('question_id',a.question_id,'guest_id',a.guest_id,'answer',a.answer)) from rsvp_answers a where a.invitation_id=i.id),'[]'::jsonb)
  ) into result from invitations i
  where upper(i.code)=upper(invitation_code) and i.status<>'disabled';
  return result;
end $$;

drop function if exists public.submit_invitation_response(text,jsonb,text,text,text,jsonb,jsonb);
create function public.submit_invitation_response(
  invitation_code text,
  guest_responses jsonb,
  song_title text default null,
  song_artist text default null,
  couple_message text default null,
  question_answers jsonb default '[]'::jsonb,
  song_suggestions jsonb default '[]'::jsonb
) returns uuid
language plpgsql security definer set search_path=public as $$
declare inv invitations%rowtype; item jsonb; song_item jsonb;
begin
  select * into inv from invitations where upper(code)=upper(invitation_code) and status<>'disabled' for update;
  if inv.id is null then raise exception 'Invitation not found'; end if;
  if inv.event_type='pre_event' then
    if not coalesce((select pre_event_rsvp_open and current_date<=pre_event_rsvp_deadline from wedding_settings where id=1),true) then raise exception 'RSVP closed'; end if;
  elsif not coalesce((select rsvp_open and current_date<=rsvp_deadline from wedding_settings where id=1),true) then
    raise exception 'RSVP closed';
  end if;
  if jsonb_array_length(guest_responses)>inv.max_guests then raise exception 'Too many guests'; end if;
  for item in select * from jsonb_array_elements(guest_responses) loop
    update guests set attendance=case when item->>'attendance' in('accepted','declined') then item->>'attendance' else attendance end,
      dietary_restrictions=nullif(left(item->>'dietary_restrictions',500),''),updated_at=now()
    where id=(item->>'id')::uuid and invitation_id=inv.id;
  end loop;
  if inv.event_type='wedding' then
    if nullif(trim(song_title),'') is not null and nullif(trim(song_artist),'') is not null then
      insert into music_suggestions(invitation_id,song,artist) values(inv.id,left(trim(song_title),150),left(trim(song_artist),150));
    end if;
    for song_item in select value from jsonb_array_elements(coalesce(song_suggestions,'[]'::jsonb)) with ordinality as songs(value,position) where position<=20 loop
      if nullif(trim(song_item->>'song'),'') is not null and nullif(trim(song_item->>'artist'),'') is not null then
        insert into music_suggestions(invitation_id,song,artist) values(inv.id,left(trim(song_item->>'song'),150),left(trim(song_item->>'artist'),150));
      end if;
    end loop;
  end if;
  if nullif(trim(couple_message),'') is not null then insert into messages(invitation_id,message) values(inv.id,left(trim(couple_message),500)); end if;
  delete from rsvp_answers where invitation_id=inv.id;
  for item in select * from jsonb_array_elements(coalesce(question_answers,'[]'::jsonb)) loop
    if exists(select 1 from rsvp_questions q where q.id=(item->>'question_id')::uuid and q.is_active and q.event_type=inv.event_type)
      and (item->>'guest_id' is null or exists(select 1 from guests g where g.id=(item->>'guest_id')::uuid and g.invitation_id=inv.id)) then
      insert into rsvp_answers(invitation_id,guest_id,question_id,answer)
      values(inv.id,nullif(item->>'guest_id','')::uuid,(item->>'question_id')::uuid,item->'answer');
    end if;
  end loop;
  update invitations set status='used' where id=inv.id;
  return inv.id;
end $$;

grant execute on function public.admin_create_invitation(text,text,text[],text) to authenticated;
grant execute on function public.admin_import_invitations(jsonb,text) to authenticated;
grant execute on function public.lookup_invitation(text) to anon,authenticated;
grant execute on function public.submit_invitation_response(text,jsonb,text,text,text,jsonb,jsonb) to anon,authenticated;
