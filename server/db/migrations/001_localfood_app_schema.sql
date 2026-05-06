create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type app_role as enum ('superadmin', 'admin', 'user');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  full_name text,
  is_active boolean not null default true,
  current_company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  cuisine_type text not null,
  description text not null,
  main_image_url text,
  rating numeric not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  distance_km numeric,
  latitude numeric,
  longitude numeric,
  price_level integer not null default 2 check (price_level in (1, 2, 3)),
  price_label text not null default '€€' check (price_label in ('€', '€€', '€€€')),
  is_open boolean not null default false,
  hours_summary text,
  address text not null,
  city text not null,
  country text not null default 'France',
  phone text,
  menu_url text,
  google_maps_url text,
  waze_url text,
  localfood_match_score integer not null default 75 check (
    localfood_match_score >= 0
    and localfood_match_score <= 100
  ),
  is_new boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete set null
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_tags (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (restaurant_id, tag_id)
);

create table if not exists public.restaurant_badges (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (restaurant_id, badge_id)
);

create table if not exists public.restaurant_photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  url text not null,
  category text not null check (
    category in ('Plats', 'Menu', 'Salle', 'Terrasse', 'Façade', 'Ambiance', 'Parking')
  ),
  is_client_photo boolean not null default false,
  author_name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_opening_hours (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  day_of_week integer not null check (day_of_week >= 1 and day_of_week <= 7),
  day_label text not null,
  hours_text text not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (restaurant_id, day_of_week)
);

create table if not exists public.restaurant_offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  conditions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  photo_url text,
  status text not null default 'published' check (status in ('published', 'pending', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_interactions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  action text not null,
  source text not null,
  interaction_type text not null check (
    interaction_type in ('Maps', 'Waze', 'Appel', 'Menu', 'Intent', 'AI', 'Avis', 'Offre', 'Vue')
  ),
  created_at timestamptz not null default now()
);

drop trigger if exists update_companies_updated_at on public.companies;
create trigger update_companies_updated_at
before update on public.companies
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

drop trigger if exists set_restaurants_updated_at on public.restaurants;
create trigger set_restaurants_updated_at
before update on public.restaurants
for each row
execute function public.set_updated_at();

drop trigger if exists set_restaurant_offers_updated_at on public.restaurant_offers;
create trigger set_restaurant_offers_updated_at
before update on public.restaurant_offers
for each row
execute function public.set_updated_at();

create index if not exists companies_slug_idx on public.companies (slug);

create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists profiles_current_company_id_idx on public.profiles (current_company_id);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);

create index if not exists company_users_user_id_idx on public.company_users (user_id);
create index if not exists company_users_company_id_idx on public.company_users (company_id);

create index if not exists idx_restaurants_slug on public.restaurants (slug);
create index if not exists idx_restaurants_city on public.restaurants (city);
create index if not exists idx_restaurants_country on public.restaurants (country);
create index if not exists idx_restaurants_is_active on public.restaurants (is_active);
create index if not exists idx_restaurants_is_open on public.restaurants (is_open);
create index if not exists idx_restaurants_rating on public.restaurants (rating desc);
create index if not exists idx_restaurants_reviews_count on public.restaurants (reviews_count desc);
create index if not exists restaurants_company_id_idx on public.restaurants (company_id);

create index if not exists idx_tags_slug on public.tags (slug);
create index if not exists idx_badges_slug on public.badges (slug);

create index if not exists idx_restaurant_tags_restaurant_id on public.restaurant_tags (restaurant_id);
create index if not exists idx_restaurant_tags_tag_id on public.restaurant_tags (tag_id);

create index if not exists idx_restaurant_badges_restaurant_id on public.restaurant_badges (restaurant_id);
create index if not exists idx_restaurant_badges_badge_id on public.restaurant_badges (badge_id);

create index if not exists idx_restaurant_photos_restaurant_id on public.restaurant_photos (restaurant_id);

create index if not exists idx_restaurant_opening_hours_restaurant_id on public.restaurant_opening_hours (restaurant_id);

create index if not exists idx_restaurant_offers_restaurant_id on public.restaurant_offers (restaurant_id);

create index if not exists restaurant_reviews_restaurant_id_idx on public.restaurant_reviews (restaurant_id);
create index if not exists restaurant_reviews_status_idx on public.restaurant_reviews (status);
create index if not exists restaurant_reviews_created_at_idx on public.restaurant_reviews (created_at desc);

create index if not exists restaurant_interactions_restaurant_id_idx on public.restaurant_interactions (restaurant_id);
create index if not exists restaurant_interactions_type_idx on public.restaurant_interactions (interaction_type);
create index if not exists restaurant_interactions_created_at_idx on public.restaurant_interactions (created_at desc);