-- LocalFood — Restrict review moderation to superadmins
-- Purpose:
-- Only superadmins can change review moderation status.
-- Company admins/users can read reviews but cannot publish, unpublish, or hide them.

create or replace function public.update_owned_restaurant_review_status(
  _review_id uuid,
  _status text
)
returns table (
  id uuid,
  status text,
  updated_at timestamptz
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

  if not public.has_role(auth.uid(), 'superadmin'::public.app_role) then
    raise exception 'Only superadmins can moderate reviews';
  end if;

  if _status not in ('published', 'pending', 'hidden') then
    raise exception 'Invalid review status';
  end if;

  select r.company_id
  into _restaurant_company_id
  from public.restaurant_reviews rr
  join public.restaurants r on r.id = rr.restaurant_id
  where rr.id = _review_id;

  if _restaurant_company_id is null then
    raise exception 'Review is not linked to a company restaurant';
  end if;

  update public.restaurant_reviews rr
  set
    status = _status,
    updated_at = now()
  where rr.id = _review_id
  returning rr.id, rr.status, rr.updated_at
  into id, status, updated_at;

  return next;
end;
$$;

grant execute on function public.update_owned_restaurant_review_status(uuid, text) to authenticated;