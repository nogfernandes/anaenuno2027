create or replace function public.admin_create_invitation(invitation_code text,invitation_language text,guest_names text[]) returns uuid language plpgsql security definer set search_path=public as $$
declare new_id uuid; guest_name text;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  if invitation_language not in('pt','en') then raise exception 'Invalid language'; end if;
  if coalesce(array_length(guest_names,1),0) not between 1 and 4 then raise exception 'Invitations require 1 to 4 guests'; end if;
  insert into invitations(code,language,max_guests,status) values(upper(trim(invitation_code)),invitation_language,array_length(guest_names,1),'active') returning id into new_id;
  foreach guest_name in array guest_names loop if nullif(trim(guest_name),'') is not null then insert into guests(invitation_id,name) values(new_id,left(trim(guest_name),150)); end if; end loop;
  return new_id;
end $$;
grant execute on function public.admin_create_invitation(text,text,text[]) to authenticated;
