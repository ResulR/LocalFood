-- LocalFood — Restrict profile self update
-- Purpose:
-- Prevent users from updating sensitive profile fields such as is_active,
-- current_company_id, email, or user_id directly from the frontend.
-- Users may only update their own full_name through a controlled RPC.

drop policy if exists "Users can update their own profile" on public.profiles;

create or replace function public.update_own_profile_full_name(
  _full_name text
)
returns table (
  id uuid,
  full_name text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles p
  set
    full_name = nullif(trim(_full_name), ''),
    updated_at = now()
  where p.user_id = auth.uid()
  returning p.id, p.full_name, p.updated_at
  into id, full_name, updated_at;

  if id is null then
    raise exception 'Profile not found';
  end if;

  return next;
end;
$$;

grant execute on function public.update_own_profile_full_name(text) to authenticated;
