-- LocalFood — Restrict hidden review status to superadmins
-- Purpose:
-- Company admins/users can publish or put reviews back to pending.
-- Only superadmins can hide reviews.

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
  _is_superadmin boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if _status not in ('published', 'pending', 'hidden') then
    raise exception 'Invalid review status';
  end if;

  _is_superadmin := public.has_role(auth.uid(), 'superadmin'::public.app_role);

  if _status = 'hidden' and not _is_superadmin then
    raise exception 'Only superadmins can hide reviews';
  end if;

  select r.company_id
  into _restaurant_company_id
  from public.restaurant_reviews rr
  join public.restaurants r on r.id = rr.restaurant_id
  where rr.id = _review_id;

  if _restaurant_company_id is null then
    raise exception 'Review is not linked to a company restaurant';
  end if;

  if not (
    _is_superadmin
    or (
      public.is_company_member(auth.uid(), _restaurant_company_id)
      and (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        or public.has_role(auth.uid(), 'user'::public.app_role)
      )
    )
  ) then
    raise exception 'Not allowed to update this review';
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