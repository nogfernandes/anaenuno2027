alter table public.invitations drop constraint if exists invitations_max_guests_check;
alter table public.invitations add constraint invitations_max_guests_check check(max_guests between 1 and 5);

create or replace function public.admin_create_invitation(invitation_code text,invitation_language text,guest_names text[]) returns uuid
language plpgsql security definer set search_path=public as $$
declare new_id uuid;guest_name text;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if invitation_language not in('pt','en') then raise exception 'Invalid language'; end if;
  if coalesce(array_length(guest_names,1),0) not between 1 and 5 then raise exception 'Invitations require 1 to 5 guests'; end if;
  insert into invitations(code,language,max_guests,status) values(upper(trim(invitation_code)),invitation_language,array_length(guest_names,1),'active') returning id into new_id;
  foreach guest_name in array guest_names loop
    if nullif(trim(guest_name),'') is not null then insert into guests(invitation_id,name) values(new_id,left(trim(guest_name),150)); end if;
  end loop;
  return new_id;
end $$;

create or replace function public.admin_add_guest(p_invitation_id uuid,p_guest_name text,p_category text default 'adult') returns uuid
language plpgsql security definer set search_path=public as $$
declare guest_count integer;new_guest_id uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if nullif(trim(p_guest_name),'') is null then raise exception 'Guest name is required'; end if;
  if p_category not in ('adult','child','baby') then raise exception 'Invalid guest category'; end if;
  perform 1 from invitations where id=p_invitation_id for update;
  if not found then raise exception 'Invitation not found'; end if;
  select count(*) into guest_count from guests where invitation_id=p_invitation_id;
  if guest_count>=5 then raise exception 'An invitation can have at most five guests'; end if;
  insert into guests(invitation_id,name,category) values(p_invitation_id,left(trim(p_guest_name),150),p_category) returning id into new_guest_id;
  update invitations set max_guests=guest_count+1 where id=p_invitation_id;
  return new_guest_id;
end $$;

create or replace function public.admin_import_invitations(p_rows jsonb) returns integer
language plpgsql security definer set search_path=public as $$
declare row_item jsonb;guest_item jsonb;new_id uuid;guest_count integer;imported integer:=0;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)=0 then raise exception 'The import has no invitations'; end if;
  if jsonb_array_length(p_rows)>500 then raise exception 'Imports are limited to 500 invitations at a time'; end if;
  for row_item in select * from jsonb_array_elements(p_rows) loop
    if row_item->>'language' not in ('pt','en') then raise exception 'Every row needs language pt or en'; end if;
    guest_count:=jsonb_array_length(coalesce(row_item->'guests','[]'::jsonb));
    if guest_count not between 1 and 5 then raise exception 'Every invitation requires 1 to 5 guests'; end if;
    insert into invitations(code,language,max_guests,status) values(upper(row_item->>'code'),row_item->>'language',guest_count,'active') returning id into new_id;
    for guest_item in select * from jsonb_array_elements(row_item->'guests') loop
      if nullif(trim(guest_item->>'name'),'') is null then raise exception 'Guest names cannot be empty'; end if;
      if coalesce(guest_item->>'category','adult') not in ('adult','child','baby') then raise exception 'Guest type must be adult, child or baby'; end if;
      insert into guests(invitation_id,name,category) values(new_id,left(trim(guest_item->>'name'),150),coalesce(guest_item->>'category','adult'));
    end loop;
    imported:=imported+1;
  end loop;
  return imported;
end $$;

grant execute on function public.admin_create_invitation(text,text,text[]) to authenticated;
grant execute on function public.admin_add_guest(uuid,text,text) to authenticated;
grant execute on function public.admin_import_invitations(jsonb) to authenticated;
