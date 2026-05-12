alter table public.local_auth_users
add column if not exists must_change_password boolean not null default false;
