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
  if guest_count>=4 then raise exception 'An invitation can have at most four guests'; end if;
  insert into guests(invitation_id,name,category) values(p_invitation_id,left(trim(p_guest_name),150),p_category) returning id into new_guest_id;
  update invitations set max_guests=guest_count+1 where id=p_invitation_id;
  return new_guest_id;
end $$;

create or replace function public.admin_remove_guest(p_guest_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare target_invitation uuid;guest_count integer;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  select invitation_id into target_invitation from guests where id=p_guest_id;
  if target_invitation is null then raise exception 'Guest not found'; end if;
  perform 1 from invitations where id=target_invitation for update;
  select count(*) into guest_count from guests where invitation_id=target_invitation;
  if guest_count<=1 then raise exception 'An invitation must keep at least one guest'; end if;
  delete from guests where id=p_guest_id;
  update invitations set max_guests=guest_count-1 where id=target_invitation;
  return target_invitation;
end $$;

grant execute on function public.admin_add_guest(uuid,text,text) to authenticated;
grant execute on function public.admin_remove_guest(uuid) to authenticated;
