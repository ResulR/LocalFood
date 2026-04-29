-- LocalFood — Restrict restaurant reviews read access
-- Purpose:
-- Keep public read access only for published reviews, while preventing any authenticated user
-- from reading pending/hidden reviews for restaurants they do not manage.

drop policy if exists "Authenticated users can read all restaurant reviews" on public.restaurant_reviews;

drop policy if exists "Superadmins can read all restaurant reviews" on public.restaurant_reviews;

create policy "Superadmins can read all restaurant reviews"
on public.restaurant_reviews
for select
to authenticated
using (
  public.has_role(auth.uid(), 'superadmin'::public.app_role)
);

drop policy if exists "Company members can read own restaurant reviews" on public.restaurant_reviews;

create policy "Company members can read own restaurant reviews"
on public.restaurant_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.restaurants r
    where r.id = restaurant_reviews.restaurant_id
      and r.company_id is not null
      and public.is_company_member(auth.uid(), r.company_id)
      and (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        or public.has_role(auth.uid(), 'user'::public.app_role)
      )
  )
);