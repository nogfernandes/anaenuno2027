create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "admin can view own access" on public.admin_users;
create policy "admin can view own access" on public.admin_users for select to authenticated using (user_id=auth.uid());

drop policy if exists "admins invitations" on public.invitations;
drop policy if exists "admins guests" on public.guests;
drop policy if exists "admins music" on public.music_suggestions;
drop policy if exists "admins messages" on public.messages;
drop policy if exists "admins settings" on public.wedding_settings;
drop policy if exists "admins site content" on public.site_content;
drop policy if exists "admins event details" on public.event_details;
drop policy if exists "admins faqs" on public.faqs;
drop policy if exists "admins questions" on public.rsvp_questions;
drop policy if exists "admins answers" on public.rsvp_answers;

create policy "admins invitations" on public.invitations for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins guests" on public.guests for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins music" on public.music_suggestions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins messages" on public.messages for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins settings" on public.wedding_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins site content" on public.site_content for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins event details" on public.event_details for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins faqs" on public.faqs for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins questions" on public.rsvp_questions for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "admins answers" on public.rsvp_answers for all to authenticated using(public.is_admin()) with check(public.is_admin());
