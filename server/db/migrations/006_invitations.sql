create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.app_role not null,
  company_id uuid references public.companies(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.invitations owner to localfood_user;

create unique index if not exists invitations_token_hash_idx
on public.invitations (token_hash);

create index if not exists invitations_email_idx
on public.invitations (lower(email));

create index if not exists invitations_company_id_idx
on public.invitations (company_id);

create index if not exists invitations_expires_at_idx
on public.invitations (expires_at);
