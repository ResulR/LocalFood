-- LocalFood — Add owned restaurant photos
-- Purpose:
-- Allow superadmins and company members to add photos to restaurants they can manage.
--
-- Note:
-- This stores a photo URL in restaurant_photos.
-- Supabase Storage upload/delete will be handled later.

create or replace function public.add_owned_restaurant_photo(
  _restaurant_id uuid,
  _url text,
  _category text
)
returns table (
  id uuid,
  restaurant_id uuid,
  url text,
  category text,
  is_client_photo boolean,
  author_name text,
  sort_order integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _restaurant_company_id uuid;
  _next_sort_order integer;
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
    raise exception 'Not allowed to add a photo to this restaurant';
  end if;

  if trim(_url) = '' then
    raise exception 'Photo URL is required';
  end if;

  if trim(_category) = '' then
    raise exception 'Photo category is required';
  end if;

  select coalesce(max(rp.sort_order), -1) + 1
  into _next_sort_order
  from public.restaurant_photos rp
  where rp.restaurant_id = _restaurant_id;

  insert into public.restaurant_photos (
    restaurant_id,
    url,
    category,
    is_client_photo,
    author_name,
    sort_order
  )
  values (
    _restaurant_id,
    trim(_url),
    trim(_category),
    false,
    null,
    _next_sort_order
  )
  returning
    restaurant_photos.id,
    restaurant_photos.restaurant_id,
    restaurant_photos.url,
    restaurant_photos.category,
    restaurant_photos.is_client_photo,
    restaurant_photos.author_name,
    restaurant_photos.sort_order,
    restaurant_photos.created_at
  into
    id,
    restaurant_id,
    url,
    category,
    is_client_photo,
    author_name,
    sort_order,
    created_at;

  return next;
end;
$$;

grant execute on function public.add_owned_restaurant_photo(uuid, text, text) to authenticated;