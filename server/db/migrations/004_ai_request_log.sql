create table if not exists public.ai_request_log (
  ip text not null,
  day date not null,
  count integer not null default 0 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ip, day)
);

alter table public.ai_request_log owner to localfood_user;

drop trigger if exists set_ai_request_log_updated_at on public.ai_request_log;

create trigger set_ai_request_log_updated_at
before update on public.ai_request_log
for each row
execute function public.set_updated_at();
