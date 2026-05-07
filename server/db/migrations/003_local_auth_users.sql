create table if not exists public.local_auth_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  email text not null unique,
  password_hash text,
  password_set boolean not null default false,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_local_auth_users_updated_at on public.local_auth_users;

create trigger set_local_auth_users_updated_at
before update on public.local_auth_users
for each row
execute function public.set_updated_at();

insert into public.local_auth_users (
  user_id,
  email,
  password_hash,
  password_set,
  is_active
)
select
  p.user_id,
  p.email,
  null,
  false,
  p.is_active
from public.profiles p
where p.email is not null
on conflict (user_id) do update
set
  email = excluded.email,
  is_active = excluded.is_active,
  updated_at = now();
