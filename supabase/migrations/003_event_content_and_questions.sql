create table if not exists public.site_content (
  id smallint primary key default 1 check (id = 1),
  city_pt text not null default 'Lisboa, Portugal',
  city_en text not null default 'Lisbon, Portugal',
  story_pt text not null default 'Há dias que guardamos. Este, queremos vivê-lo convosco.',
  story_en text not null default 'Some days stay with us. This one, we want to share with you.',
  dress_title_pt text not null default 'Elegante, com leveza',
  dress_title_en text not null default 'Elegant, with ease',
  dress_text_pt text not null default 'Tons naturais, tecidos leves e liberdade para dançar. Pedimos apenas que evitem branco.',
  dress_text_en text not null default 'Natural shades, light fabrics and freedom to dance. We only ask that you avoid white.',
  rsvp_intro_pt text not null default 'Usa o código único do teu convite.',
  rsvp_intro_en text not null default 'Use the unique code on your invitation.',
  playlist_prompt_pt text not null default 'Uma música para a pista',
  playlist_prompt_en text not null default 'One for the dance floor',
  message_prompt_pt text not null default 'Uma mensagem para nós',
  message_prompt_en text not null default 'A message for us',
  footer_pt text not null default 'Mal podemos esperar por vos ter connosco.',
  footer_en text not null default 'We cannot wait to have you with us.',
  updated_at timestamptz not null default now()
);

insert into public.site_content(id) values (1) on conflict do nothing;

create table if not exists public.event_details (
  id uuid primary key default gen_random_uuid(),
  title_pt text not null,
  title_en text not null,
  description_pt text,
  description_en text,
  event_date date not null default '2027-04-24',
  start_time time,
  end_time time,
  venue text,
  address text,
  maps_url text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.event_details(title_pt,title_en,description_pt,description_en,event_date,start_time,venue,position)
select 'Cerimónia','Ceremony',null,null,'2027-04-24','14:30','Lisboa',1
where not exists (select 1 from public.event_details);
insert into public.event_details(title_pt,title_en,description_pt,description_en,event_date,start_time,venue,position)
select 'Jantar & festa','Dinner & dancing','Até tarde','Until late','2027-04-24','17:00','Lisboa',2
where (select count(*) from public.event_details) = 1;

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question_pt text not null,
  question_en text not null,
  answer_pt text not null,
  answer_en text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.faqs(question_pt,question_en,answer_pt,answer_en,position)
select * from (values
  ('Posso levar acompanhante?','Can I bring a guest?','O convite indica todas as pessoas incluídas. Se tiveres dúvidas, fala connosco.','Your invitation lists everyone included. If in doubt, please ask us.',1),
  ('E as crianças?','What about children?','As crianças identificadas no convite são muito bem-vindas.','Children named on the invitation are very welcome.',2),
  ('Até quando devo responder?','When should I reply?','Pedimos a tua resposta até 24 de janeiro de 2027.','Please reply by 24 January 2027.',3)
) as defaults(question_pt,question_en,answer_pt,answer_en,position)
where not exists (select 1 from public.faqs);

create table if not exists public.rsvp_questions (
  id uuid primary key default gen_random_uuid(),
  label_pt text not null,
  label_en text not null,
  help_pt text,
  help_en text,
  question_type text not null check (question_type in ('short_text','long_text','single_choice','multiple_choice','yes_no')),
  scope text not null default 'invitation' check (scope in ('invitation','guest')),
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rsvp_answers (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete cascade,
  question_id uuid not null references public.rsvp_questions(id) on delete cascade,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.event_details enable row level security;
alter table public.faqs enable row level security;
alter table public.rsvp_questions enable row level security;
alter table public.rsvp_answers enable row level security;

create policy "public site content" on public.site_content for select to anon using (true);
create policy "public event details" on public.event_details for select to anon using (is_active);
create policy "public faqs" on public.faqs for select to anon using (is_active);
create policy "admins site content" on public.site_content for all to authenticated using (true) with check (true);
create policy "admins event details" on public.event_details for all to authenticated using (true) with check (true);
create policy "admins faqs" on public.faqs for all to authenticated using (true) with check (true);
create policy "admins questions" on public.rsvp_questions for all to authenticated using (true) with check (true);
create policy "admins answers" on public.rsvp_answers for all to authenticated using (true) with check (true);

create or replace function public.lookup_invitation(invitation_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if not coalesce((select rsvp_open from wedding_settings where id=1),true) then raise exception 'RSVP closed'; end if;
  select jsonb_build_object(
    'id',i.id,'code',i.code,'language',i.language,'max_guests',i.max_guests,'status',i.status,
    'guests',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'category',g.category,'attendance',g.attendance,'dietary_restrictions',g.dietary_restrictions,'notes',g.notes) order by g.name) from guests g where g.invitation_id=i.id),'[]'::jsonb),
    'questions',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'label_pt',q.label_pt,'label_en',q.label_en,'help_pt',q.help_pt,'help_en',q.help_en,'question_type',q.question_type,'scope',q.scope,'options',q.options,'required',q.required,'position',q.position) order by q.position,q.created_at) from rsvp_questions q where q.is_active),'[]'::jsonb),
    'answers',coalesce((select jsonb_agg(jsonb_build_object('question_id',a.question_id,'guest_id',a.guest_id,'answer',a.answer)) from rsvp_answers a where a.invitation_id=i.id),'[]'::jsonb)
  ) into result
  from invitations i where upper(i.code)=upper(invitation_code) and i.status<>'disabled';
  return result;
end $$;

drop function if exists public.submit_invitation_response(text,jsonb,text,text,text);
create function public.submit_invitation_response(invitation_code text,guest_responses jsonb,song_title text default null,song_artist text default null,couple_message text default null,question_answers jsonb default '[]'::jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare inv invitations%rowtype; item jsonb;
begin
  if not coalesce((select rsvp_open and current_date<=rsvp_deadline from wedding_settings where id=1),true) then raise exception 'RSVP closed'; end if;
  select * into inv from invitations where upper(code)=upper(invitation_code) and status<>'disabled' for update;
  if inv.id is null then raise exception 'Invitation not found'; end if;
  if jsonb_array_length(guest_responses)>inv.max_guests then raise exception 'Too many guests'; end if;
  for item in select * from jsonb_array_elements(guest_responses) loop
    update guests set attendance=case when item->>'attendance' in('accepted','declined') then item->>'attendance' else attendance end,dietary_restrictions=nullif(left(item->>'dietary_restrictions',500),''),updated_at=now() where id=(item->>'id')::uuid and invitation_id=inv.id;
  end loop;
  if nullif(trim(song_title),'') is not null and nullif(trim(song_artist),'') is not null then insert into music_suggestions(invitation_id,song,artist) values(inv.id,left(trim(song_title),150),left(trim(song_artist),150)); end if;
  if nullif(trim(couple_message),'') is not null then insert into messages(invitation_id,message) values(inv.id,left(trim(couple_message),500)); end if;
  delete from rsvp_answers where invitation_id=inv.id;
  for item in select * from jsonb_array_elements(coalesce(question_answers,'[]'::jsonb)) loop
    if exists(select 1 from rsvp_questions q where q.id=(item->>'question_id')::uuid and q.is_active)
      and (item->>'guest_id' is null or exists(select 1 from guests g where g.id=(item->>'guest_id')::uuid and g.invitation_id=inv.id)) then
      insert into rsvp_answers(invitation_id,guest_id,question_id,answer) values(inv.id,nullif(item->>'guest_id','')::uuid,(item->>'question_id')::uuid,item->'answer');
    end if;
  end loop;
  update invitations set status='used' where id=inv.id;
  return inv.id;
end $$;

grant execute on function public.lookup_invitation(text) to anon,authenticated;
grant execute on function public.submit_invitation_response(text,jsonb,text,text,text,jsonb) to anon,authenticated;
