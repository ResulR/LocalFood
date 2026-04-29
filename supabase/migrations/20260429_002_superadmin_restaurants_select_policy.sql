-- LocalFood — RLS policy for SuperAdmin restaurant reads
-- Purpose:
-- Allow authenticated superadmins to read all restaurants,
-- including inactive restaurants hidden from the public site.

drop policy if exists "Superadmins can read all restaurants" on public.restaurants;

create policy "Superadmins can read all restaurants"
on public.restaurants
for select
to authenticated
using (
  public.has_role(auth.uid(), 'superadmin'::public.app_role)
);