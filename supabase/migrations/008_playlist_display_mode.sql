alter table public.wedding_settings
  add column if not exists playlist_display_mode text not null default 'list';

alter table public.wedding_settings
  drop constraint if exists wedding_settings_playlist_display_mode_check;

alter table public.wedding_settings
  add constraint wedding_settings_playlist_display_mode_check
  check (playlist_display_mode in ('list', 'cloud'));
