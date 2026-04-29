-- LocalFood — Restrict public reads for restaurant related tables
-- Purpose:
-- Public users should only read related restaurant data when the parent restaurant is active.

drop policy if exists "Public can read restaurant photos" on public.restaurant_photos;

create policy "Public can read active restaurant photos"
on public.restaurant_photos
for select
to public
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_photos.restaurant_id
      and r.is_active = true
  )
);

drop policy if exists "Public can read restaurant opening hours" on public.restaurant_opening_hours;

create policy "Public can read active restaurant opening hours"
on public.restaurant_opening_hours
for select
to public
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_opening_hours.restaurant_id
      and r.is_active = true
  )
);

drop policy if exists "Public can read restaurant tags" on public.restaurant_tags;

create policy "Public can read active restaurant tags"
on public.restaurant_tags
for select
to public
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_tags.restaurant_id
      and r.is_active = true
  )
);

drop policy if exists "Public can read restaurant badges" on public.restaurant_badges;

create policy "Public can read active restaurant badges"
on public.restaurant_badges
for select
to public
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_badges.restaurant_id
      and r.is_active = true
  )
);