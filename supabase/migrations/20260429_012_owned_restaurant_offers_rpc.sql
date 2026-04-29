-- LocalFood — Owned restaurant offers RPC
-- Purpose:
-- Allow SuperAdmin and company admins/users to manage offers for restaurants they can manage.
-- V1 intentionally does not delete offers; offers can be activated/deactivated.

create or replace function public.fetch_owned_restaurant_offers(
  _restaurant_id uuid
)
returns table (
  id uuid,
  restaurant_id uuid,
  code text,
  title text,
  description text,
  conditions text,
  is_active boolean,
  created_at timestamptz,
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
    raise exception 'Not allowed to read offers for this restaurant';
  end if;

  return query
  select
    ro.id,
    ro.restaurant_id,
    ro.code,
    ro.title,
    ro.description,
    ro.conditions,
    ro.is_active,
    ro.created_at,
    ro.updated_at
  from public.restaurant_offers ro
  where ro.restaurant_id = _restaurant_id
  order by ro.created_at desc;
end;
$$;

create or replace function public.upsert_owned_restaurant_offer(
  _offer_id uuid,
  _restaurant_id uuid,
  _code text,
  _title text,
  _description text,
  _conditions text,
  _is_active boolean
)
returns table (
  id uuid,
  restaurant_id uuid,
  code text,
  title text,
  description text,
  conditions text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _restaurant_company_id uuid;
  _existing_offer_restaurant_id uuid;
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
    raise exception 'Not allowed to manage offers for this restaurant';
  end if;

  if nullif(trim(_code), '') is null then
    raise exception 'Offer code is required';
  end if;

  if nullif(trim(_title), '') is null then
    raise exception 'Offer title is required';
  end if;

  if nullif(trim(_description), '') is null then
    raise exception 'Offer description is required';
  end if;

  if _offer_id is null then
    return query
    insert into public.restaurant_offers (
      restaurant_id,
      code,
      title,
      description,
      conditions,
      is_active
    )
    values (
      _restaurant_id,
      upper(trim(_code)),
      trim(_title),
      trim(_description),
      nullif(trim(_conditions), ''),
      _is_active
    )
    returning
      restaurant_offers.id,
      restaurant_offers.restaurant_id,
      restaurant_offers.code,
      restaurant_offers.title,
      restaurant_offers.description,
      restaurant_offers.conditions,
      restaurant_offers.is_active,
      restaurant_offers.created_at,
      restaurant_offers.updated_at;

    return;
  end if;

  select ro.restaurant_id
  into _existing_offer_restaurant_id
  from public.restaurant_offers ro
  where ro.id = _offer_id;

  if _existing_offer_restaurant_id is null then
    raise exception 'Offer not found';
  end if;

  if _existing_offer_restaurant_id <> _restaurant_id then
    raise exception 'Offer does not belong to this restaurant';
  end if;

  return query
  update public.restaurant_offers ro
  set
    code = upper(trim(_code)),
    title = trim(_title),
    description = trim(_description),
    conditions = nullif(trim(_conditions), ''),
    is_active = _is_active,
    updated_at = now()
  where ro.id = _offer_id
  returning
    ro.id,
    ro.restaurant_id,
    ro.code,
    ro.title,
    ro.description,
    ro.conditions,
    ro.is_active,
    ro.created_at,
    ro.updated_at;
end;
$$;

create or replace function public.update_owned_restaurant_offer_status(
  _offer_id uuid,
  _is_active boolean
)
returns table (
  id uuid,
  restaurant_id uuid,
  is_active boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _restaurant_id uuid;
  _restaurant_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select ro.restaurant_id
  into _restaurant_id
  from public.restaurant_offers ro
  where ro.id = _offer_id;

  if _restaurant_id is null then
    raise exception 'Offer not found';
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
    raise exception 'Not allowed to update this offer';
  end if;

  return query
  update public.restaurant_offers ro
  set
    is_active = _is_active,
    updated_at = now()
  where ro.id = _offer_id
  returning
    ro.id,
    ro.restaurant_id,
    ro.is_active,
    ro.updated_at;
end;
$$;

grant execute on function public.fetch_owned_restaurant_offers(uuid) to authenticated;
grant execute on function public.upsert_owned_restaurant_offer(uuid, uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.update_owned_restaurant_offer_status(uuid, boolean) to authenticated;
