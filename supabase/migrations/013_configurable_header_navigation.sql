alter table public.wedding_settings
  add column if not exists header_show_story boolean not null default true,
  add column if not exists header_show_programme boolean not null default false,
  add column if not exists header_show_wedding_rsvp boolean not null default false,
  add column if not exists header_show_faq boolean not null default true,
  add column if not exists header_show_dress_code boolean not null default false,
  add column if not exists header_show_playlist boolean not null default false,
  add column if not exists header_show_pre_event boolean not null default true;

update public.wedding_settings set
  header_show_story=true,
  header_show_programme=false,
  header_show_wedding_rsvp=false,
  header_show_faq=true,
  header_show_dress_code=false,
  header_show_playlist=false,
  header_show_pre_event=true
where id=1;

update public.site_content
set ui_copy=coalesce(ui_copy,'{}'::jsonb)||jsonb_build_object(
  'playlist_nav_pt','Música','playlist_nav_en','Music',
  'pre_event_nav_pt','RSVP Cartório','pre_event_nav_en','Registry office RSVP'
),updated_at=now()
where id=1;
