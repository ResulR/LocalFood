-- LocalFood — Delete owned restaurant photos
-- Purpose:
-- Allow superadmins and company members to delete photos linked to restaurants they can manage.
--
-- Note:
-- This only deletes the database row from restaurant_photos.
-- If photos are later stored in Supabase Storage, file deletion must be handled separately.

create or replace function public.delete_owned_restaurant_photo(
  _photo_id uuid
)
returns table (
  id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _restaurant_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select r.company_id
  into _restaurant_company_id
  from public.restaurant_photos rp
  join public.restaurants r on r.id = rp.restaurant_id
  where rp.id = _photo_id;

  if _restaurant_company_id is null then
    raise exception 'Photo is not linked to a company restaurant';
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
    raise exception 'Not allowed to delete this photo';
  end if;

  delete from public.restaurant_photos rp
  where rp.id = _photo_id
  returning rp.id into id;

  return next;
end;
$$;

grant execute on function public.delete_owned_restaurant_photo(uuid) to authenticated;