create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.password_reset_tokens owner to localfood_user;

create unique index if not exists password_reset_tokens_token_hash_idx
on public.password_reset_tokens (token_hash);

create index if not exists password_reset_tokens_user_id_expires_at_idx
on public.password_reset_tokens (user_id, expires_at);
