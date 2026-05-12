create table if not exists public.revoked_tokens (
  jti uuid primary key,
  user_id uuid references public.profiles(user_id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.revoked_tokens owner to localfood_user;

create index if not exists revoked_tokens_expires_at_idx
  on public.revoked_tokens (expires_at);
