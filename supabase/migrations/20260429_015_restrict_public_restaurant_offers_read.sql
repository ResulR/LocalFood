-- LocalFood — Restrict public restaurant offers read access
-- Purpose:
-- Public users should only read active offers linked to active restaurants.

drop policy if exists "Public can read active restaurant offers" on public.restaurant_offers;

create policy "Public can read active restaurant offers"
on public.restaurant_offers
for select
to public
using (
  is_active = true
  and exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_offers.restaurant_id
      and r.is_active = true
  )
);