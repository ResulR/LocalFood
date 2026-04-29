-- LocalFood — Restrict restaurant interactions read access
-- Purpose:
-- Keep public insert for tracking interactions, but prevent public read access
-- to business-sensitive restaurant interaction analytics.

drop policy if exists "Public can read restaurant interactions" on public.restaurant_interactions;

drop policy if exists "Superadmins can read all restaurant interactions" on public.restaurant_interactions;

create policy "Superadmins can read all restaurant interactions"
on public.restaurant_interactions
for select
to authenticated
using (
  public.has_role(auth.uid(), 'superadmin'::public.app_role)
);

drop policy if exists "Company members can read own restaurant interactions" on public.restaurant_interactions;

create policy "Company members can read own restaurant interactions"
on public.restaurant_interactions
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_interactions.restaurant_id
      and r.company_id is not null
      and public.is_company_member(auth.uid(), r.company_id)
      and (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        or public.has_role(auth.uid(), 'user'::public.app_role)
      )
  )
);