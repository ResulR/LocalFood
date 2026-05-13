alter table public.profiles
add column if not exists deletion_requested_at timestamptz;

alter table public.local_auth_users
add column if not exists deletion_requested_at timestamptz;
