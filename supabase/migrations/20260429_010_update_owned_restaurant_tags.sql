-- LocalFood — Update owned restaurant tags
-- Purpose:
-- Allow superadmins and company members to update tag relations for restaurants they can manage.
--
-- Safety:
-- - Accepts only existing active tag slugs.
-- - Does not create new tags.
-- - Replaces all tag relations for the restaurant.

create or replace function public.update_owned_restaurant_tags(
  _restaurant_id uuid,
  _tag_slugs text[]
)
returns table (
  restaurant_id uuid,
  tag_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _restaurant_company_id uuid;
  _normalized_slugs text[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select r.company_id
  into _restaurant_company_id
  from public.restaurants r
  where r.id = _restaurant_id;

  if _restaurant_company_id is null then
    raise exception 'Restaurant is not linked to a company';
  end if;

  if not (
    public.has_role(auth.uid(), 'superadmin'::public.app_role)
    or (
      public.is_company_member(auth.uid(), _restaurant_company_id)
      and (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        or public.has_role(auth.uid(), 'user'::public.app_role)
      )
    )
  ) then
    raise exception 'Not allowed to update tags for this restaurant';
  end if;

  select coalesce(array_agg(distinct lower(trim(slug))), array[]::text[])
  into _normalized_slugs
  from unnest(coalesce(_tag_slugs, array[]::text[])) as slug
  where trim(slug) <> '';

  delete from public.restaurant_tags rt
  where rt.restaurant_id = _restaurant_id;

  insert into public.restaurant_tags (
    restaurant_id,
    tag_id
  )
  select
    _restaurant_id,
    t.id
  from public.tags t
  where t.is_active = true
    and t.slug = any(_normalized_slugs);

  return query
  select
    _restaurant_id,
    count(*)::integer
  from public.restaurant_tags rt
  where rt.restaurant_id = _restaurant_id;
end;
$$;

grant execute on function public.update_owned_restaurant_tags(uuid, text[]) to authenticated;