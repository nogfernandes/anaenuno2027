alter table public.wedding_settings
  add column if not exists show_public_playlist boolean not null default false;

create or replace function public.get_public_music_suggestions()
returns table(song text, artist text)
language sql
stable
security definer
set search_path = public
as $$
  select suggestion.song, suggestion.artist
  from public.music_suggestions as suggestion
  where coalesce(
    (select settings.show_public_playlist from public.wedding_settings as settings where settings.id = 1),
    false
  )
  order by lower(suggestion.artist), lower(suggestion.song), suggestion.created_at;
$$;

revoke all on function public.get_public_music_suggestions() from public;
grant execute on function public.get_public_music_suggestions() to anon, authenticated;
