-- LocalFood — Company member access for restaurants
-- Purpose:
-- Allow admins/users of a company to read inactive restaurants owned by their company
-- and update only safe restaurant fields through a controlled RPC.
--
-- Protected fields not updated by RPC:
-- - company_id
-- - rating
-- - reviews_count
-- - slug

create or replace function public.is_company_member(
  _user_id uuid,
  _company_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users cu
    where cu.user_id = _user_id
      and cu.company_id = _company_id
  );
$$;

grant execute on function public.is_company_member(uuid, uuid) to authenticated;

drop policy if exists "Company members can read own restaurants" on public.restaurants;

create policy "Company members can read own restaurants"
on public.restaurants
for select
to authenticated
using (
  company_id is not null
  and public.is_company_member(auth.uid(), company_id)
  and (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'user'::public.app_role)
  )
);

create or replace function public.update_owned_restaurant(
  _restaurant_id uuid,
  _name text,
  _category text,
  _cuisine_type text,
  _description text,
  _price_label text,
  _is_open boolean,
  _address text,
  _city text,
  _country text,
  _phone text,
  _is_active boolean
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
  _price_level integer;
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
    raise exception 'Not allowed to update this restaurant';
  end if;

  if _price_label not in ('€', '€€', '€€€') then
    raise exception 'Invalid price label';
  end if;

  _price_level :=
    case _price_label
      when '€' then 1
      when '€€' then 2
      when '€€€' then 3
      else 2
    end;

  update public.restaurants r
  set
    name = trim(_name),
    category = trim(_category),
    cuisine_type = trim(_cuisine_type),
    description = trim(_description),
    price_label = _price_label,
    price_level = _price_level,
    is_open = _is_open,
    address = trim(_address),
    city = trim(_city),
    country = trim(_country),
    phone = nullif(trim(_phone), ''),
    is_active = _is_active,
    updated_at = now()
  where r.id = _restaurant_id
  returning r.id into id;

  return next;
end;
$$;

grant execute on function public.update_owned_restaurant(
  uuid,
  text,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text,
  text,
  boolean
) to authenticated;