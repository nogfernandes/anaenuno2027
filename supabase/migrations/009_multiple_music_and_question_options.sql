do $$
declare
  question record;
  pt_labels text[];
  en_labels text[];
  option_count integer;
  rebuilt_options jsonb;
begin
  for question in
    select id, options
    from public.rsvp_questions
    where jsonb_array_length(options) = 1
  loop
    pt_labels := regexp_split_to_array(coalesce(question.options->0->>'label_pt',''), E'\\r?\\n');
    en_labels := regexp_split_to_array(coalesce(question.options->0->>'label_en',''), E'\\r?\\n');
    option_count := greatest(cardinality(pt_labels), cardinality(en_labels));

    if option_count > 1 then
      select jsonb_agg(
        jsonb_build_object(
          'label_pt', coalesce(nullif(btrim(pt_labels[position]),''), nullif(btrim(en_labels[position]),'')),
          'label_en', coalesce(nullif(btrim(en_labels[position]),''), nullif(btrim(pt_labels[position]),'')),
          'value', 'option_' || position
        ) order by position
      )
      into rebuilt_options
      from generate_series(1, option_count) as position
      where coalesce(nullif(btrim(pt_labels[position]),''), nullif(btrim(en_labels[position]),'')) is not null;

      update public.rsvp_questions
      set options = coalesce(rebuilt_options, '[]'::jsonb), updated_at = now()
      where id = question.id;
    end if;
  end loop;
end $$;

update public.event_details
set
  title_pt = replace(title_pt, ' & ', ' + '),
  title_en = replace(title_en, ' & ', ' + '),
  updated_at = now()
where title_pt like '% & %' or title_en like '% & %';

drop function if exists public.submit_invitation_response(text,jsonb,text,text,text,jsonb);

create function public.submit_invitation_response(
  invitation_code text,
  guest_responses jsonb,
  song_title text default null,
  song_artist text default null,
  couple_message text default null,
  question_answers jsonb default '[]'::jsonb,
  song_suggestions jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  inv invitations%rowtype;
  item jsonb;
  song_item jsonb;
begin
  if not coalesce((select rsvp_open and current_date<=rsvp_deadline from wedding_settings where id=1),true) then raise exception 'RSVP closed'; end if;
  select * into inv from invitations where upper(code)=upper(invitation_code) and status<>'disabled' for update;
  if inv.id is null then raise exception 'Invitation not found'; end if;
  if jsonb_array_length(guest_responses)>inv.max_guests then raise exception 'Too many guests'; end if;

  for item in select * from jsonb_array_elements(guest_responses) loop
    update guests set attendance=case when item->>'attendance' in('accepted','declined') then item->>'attendance' else attendance end,dietary_restrictions=nullif(left(item->>'dietary_restrictions',500),''),updated_at=now() where id=(item->>'id')::uuid and invitation_id=inv.id;
  end loop;

  if nullif(trim(song_title),'') is not null and nullif(trim(song_artist),'') is not null then
    insert into music_suggestions(invitation_id,song,artist) values(inv.id,left(trim(song_title),150),left(trim(song_artist),150));
  end if;

  for song_item in
    select value
    from jsonb_array_elements(coalesce(song_suggestions,'[]'::jsonb)) with ordinality as songs(value,position)
    where position <= 20
  loop
    if nullif(trim(song_item->>'song'),'') is not null and nullif(trim(song_item->>'artist'),'') is not null then
      insert into music_suggestions(invitation_id,song,artist)
      values(inv.id,left(trim(song_item->>'song'),150),left(trim(song_item->>'artist'),150));
    end if;
  end loop;

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

grant execute on function public.submit_invitation_response(text,jsonb,text,text,text,jsonb,jsonb) to anon,authenticated;
