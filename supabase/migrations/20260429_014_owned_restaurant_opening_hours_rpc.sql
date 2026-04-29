-- LocalFood — Owned restaurant opening hours RPC
-- Purpose:
-- Allow SuperAdmin and company admins/users to manage opening hours for restaurants they can manage.

create or replace function public.fetch_owned_restaurant_opening_hours(
  _restaurant_id uuid
)
returns table (
  id uuid,
  restaurant_id uuid,
  day_of_week integer,
  day_label text,
  hours_text text,
  is_closed boolean,
  created_at timestamptz
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
    raise exception 'Not allowed to read opening hours for this restaurant';
  end if;

  return query
  select
    roh.id,
    roh.restaurant_id,
    roh.day_of_week,
    roh.day_label,
    roh.hours_text,
    roh.is_closed,
    roh.created_at
  from public.restaurant_opening_hours roh
  where roh.restaurant_id = _restaurant_id
  order by roh.day_of_week asc;
end;
$$;

create or replace function public.upsert_owned_restaurant_opening_hours(
  _restaurant_id uuid,
  _hours jsonb
)
returns table (
  id uuid,
  restaurant_id uuid,
  day_of_week integer,
  day_label text,
  hours_text text,
  is_closed boolean,
  created_at timestamptz
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
    raise exception 'Not allowed to manage opening hours for this restaurant';
  end if;

  if jsonb_typeof(_hours) <> 'array' then
    raise exception 'Opening hours payload must be an array';
  end if;

  insert into public.restaurant_opening_hours (
    restaurant_id,
    day_of_week,
    day_label,
    hours_text,
    is_closed
  )
  select
    _restaurant_id,
    (item->>'day_of_week')::integer,
    trim(item->>'day_label'),
    case
      when coalesce((item->>'is_closed')::boolean, false) then 'Fermé'
      else trim(item->>'hours_text')
    end,
    coalesce((item->>'is_closed')::boolean, false)
  from jsonb_array_elements(_hours) as item
  where (item->>'day_of_week')::integer between 1 and 7
    and nullif(trim(item->>'day_label'), '') is not null
    and (
      coalesce((item->>'is_closed')::boolean, false)
      or nullif(trim(item->>'hours_text'), '') is not null
    )
  on conflict (restaurant_id, day_of_week)
  do update set
    day_label = excluded.day_label,
    hours_text = excluded.hours_text,
    is_closed = excluded.is_closed;

  return query
  select
    roh.id,
    roh.restaurant_id,
    roh.day_of_week,
    roh.day_label,
    roh.hours_text,
    roh.is_closed,
    roh.created_at
  from public.restaurant_opening_hours roh
  where roh.restaurant_id = _restaurant_id
  order by roh.day_of_week asc;
end;
$$;

grant execute on function public.fetch_owned_restaurant_opening_hours(uuid) to authenticated;
grant execute on function public.upsert_owned_restaurant_opening_hours(uuid, jsonb) to authenticated;
