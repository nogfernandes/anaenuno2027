alter table public.event_details
  add column if not exists venue_pt text,
  add column if not exists venue_en text,
  add column if not exists address_pt text,
  add column if not exists address_en text;

update public.event_details
set
  venue_pt = coalesce(venue_pt, venue),
  venue_en = coalesce(venue_en, case when lower(btrim(venue)) = 'lisboa' then 'Lisbon' else venue end),
  address_pt = coalesce(address_pt, address),
  address_en = coalesce(address_en, address),
  updated_at = now()
where venue_pt is null or venue_en is null or address_pt is null or address_en is null;
