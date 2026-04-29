-- LocalFood — RLS policy for SuperAdmin restaurant updates
-- Purpose:
-- Allow authenticated superadmins to update restaurants, including company assignment
-- and future admin fields such as is_active.

drop policy if exists "Superadmins can update restaurants" on public.restaurants;

create policy "Superadmins can update restaurants"
on public.restaurants
for update
to authenticated
using (
  public.has_role(auth.uid(), 'superadmin'::public.app_role)
)
with check (
  public.has_role(auth.uid(), 'superadmin'::public.app_role)
);