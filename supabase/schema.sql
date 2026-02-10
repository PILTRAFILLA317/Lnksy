-- =============================================================
-- Lnksy — Complete Supabase Schema
-- Run this in the Supabase SQL Editor or via `psql`
-- =============================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- =============================================================
-- 1. TABLES
-- =============================================================

-- 1a. Profiles
create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  handle       text not null,
  name         text,
  bio          text,
  avatar_url   text,
  theme_id     text not null default 'default',
  theme_overrides jsonb not null default '{}',
  plan         text not null default 'FREE'
                 check (plan in ('FREE', 'PRO')),
  branding_enabled boolean not null default true,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz,

  constraint profiles_handle_unique unique (handle),
  constraint profiles_owner_unique unique (owner_id),
  constraint profiles_handle_format check (
    handle ~ '^[a-z0-9]([a-z0-9-]{1,22}[a-z0-9])?$'
    and handle not like '%---%'
    and handle not like '--%'
    and handle not like '%--'
  )
);

create index idx_profiles_handle on public.profiles (handle)
  where deleted_at is null;
create index idx_profiles_owner on public.profiles (owner_id);

-- 1b. Links
create table public.links (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  url          text not null,
  subtitle     text,
  icon         text,
  order_index  int not null default 0,
  is_active    boolean not null default true,
  highlight    boolean not null default false,
  start_at     timestamptz,
  end_at       timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_links_profile on public.links (profile_id, order_index);

-- 1c. Themes
create table public.themes (
  id     text primary key,
  name   text not null,
  is_pro boolean not null default false,
  config jsonb not null default '{}'
);

-- 1d. Reserved slugs
create table public.reserved_slugs (
  slug text primary key
);

-- 1e. Daily profile stats
create table public.daily_profile_stats (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  views      int not null default 0,
  uniques    int not null default 0,
  clicks     int not null default 0,
  primary key (profile_id, date)
);

-- 1f. Daily link stats
create table public.daily_link_stats (
  link_id uuid not null references public.links(id) on delete cascade,
  date    date not null,
  clicks  int not null default 0,
  primary key (link_id, date)
);

-- 1g. Analytics sessions (for unique dedup)
create table public.analytics_sessions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  anon_id      text not null,
  last_seen_at timestamptz not null default now()
);

create unique index idx_sessions_dedup
  on public.analytics_sessions (profile_id, anon_id);
create index idx_sessions_last_seen
  on public.analytics_sessions (last_seen_at);

-- 1h. Billing
create table public.billing (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,
  profile_id           uuid references public.profiles(id) on delete set null,
  stripe_customer_id   text,
  subscription_id      text,
  plan                 text not null default 'FREE'
                         check (plan in ('FREE', 'PRO')),
  status               text not null default 'inactive'
                         check (status in (
                           'active', 'inactive', 'past_due',
                           'canceled', 'trialing'
                         )),
  current_period_end   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint billing_owner_unique unique (owner_id)
);

create index idx_billing_stripe_customer
  on public.billing (stripe_customer_id);

-- 1i. Stripe webhook idempotency
create table public.stripe_webhook_events (
  event_id    text primary key,
  received_at timestamptz not null default now()
);

-- =============================================================
-- 2. FUNCTIONS & TRIGGERS
-- =============================================================

-- 2a. Prevent handle change after creation
create or replace function public.prevent_handle_change()
returns trigger as $$
begin
  if OLD.handle is distinct from NEW.handle then
    raise exception 'Handle cannot be changed after creation';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_prevent_handle_change
  before update on public.profiles
  for each row execute function public.prevent_handle_change();

-- 2b. Auto-update updated_at on links
create or replace function public.set_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_links_updated_at
  before update on public.links
  for each row execute function public.set_updated_at();

create trigger trg_billing_updated_at
  before update on public.billing
  for each row execute function public.set_updated_at();

-- 2c. Check reserved slug on profile insert
create or replace function public.check_reserved_slug()
returns trigger as $$
begin
  if exists (
    select 1 from public.reserved_slugs where slug = NEW.handle
  ) then
    raise exception 'This handle is reserved';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_check_reserved_slug
  before insert on public.profiles
  for each row execute function public.check_reserved_slug();

-- 2d. Enforce free plan link limit (25)
create or replace function public.check_link_limit()
returns trigger as $$
declare
  profile_plan text;
  link_count   int;
begin
  select plan into profile_plan
    from public.profiles where id = NEW.profile_id;

  if profile_plan = 'FREE' then
    select count(*) into link_count
      from public.links where profile_id = NEW.profile_id;

    if link_count >= 25 then
      raise exception 'Free plan limited to 25 links';
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_check_link_limit
  before insert on public.links
  for each row execute function public.check_link_limit();

-- =============================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================

alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.themes enable row level security;
alter table public.reserved_slugs enable row level security;
alter table public.daily_profile_stats enable row level security;
alter table public.daily_link_stats enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.billing enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- 3a. Profiles policies
create policy "Owner can do everything with own profile"
  on public.profiles for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Public can read active profiles by handle"
  on public.profiles for select
  using (deleted_at is null);

-- 3b. Links policies
create policy "Owner can manage own links"
  on public.links for all
  using (
    exists (
      select 1 from public.profiles
      where id = links.profile_id and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = links.profile_id and owner_id = auth.uid()
    )
  );

create policy "Public can read active links of public profiles"
  on public.links for select
  using (
    is_active = true
    and (start_at is null or start_at <= now())
    and (end_at is null or end_at > now())
    and exists (
      select 1 from public.profiles
      where id = links.profile_id and deleted_at is null
    )
  );

-- 3c. Themes — public read
create policy "Anyone can read themes"
  on public.themes for select
  using (true);

-- 3d. Reserved slugs — public read
create policy "Anyone can read reserved slugs"
  on public.reserved_slugs for select
  using (true);

-- 3e. Daily profile stats — owner only
create policy "Owner can read own profile stats"
  on public.daily_profile_stats for select
  using (
    exists (
      select 1 from public.profiles
      where id = daily_profile_stats.profile_id
        and owner_id = auth.uid()
    )
  );

-- Service role inserts stats, no user insert policy needed

-- 3f. Daily link stats — owner only
create policy "Owner can read own link stats"
  on public.daily_link_stats for select
  using (
    exists (
      select 1 from public.links l
      join public.profiles p on p.id = l.profile_id
      where l.id = daily_link_stats.link_id
        and p.owner_id = auth.uid()
    )
  );

-- 3g. Analytics sessions — no user access (service role only)
-- No policies needed; service role bypasses RLS

-- 3h. Billing — owner only
create policy "Owner can read own billing"
  on public.billing for select
  using (auth.uid() = owner_id);

-- 3i. Stripe webhook events — service role only
-- No policies needed; service role bypasses RLS

-- =============================================================
-- 4. STORAGE BUCKET
-- =============================================================

-- Create the avatars bucket (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public)
--   values ('avatars', 'avatars', true);

-- Storage policies (run after bucket creation):
-- create policy "Users can upload their own avatar"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'avatars'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- create policy "Users can update their own avatar"
--   on storage.objects for update
--   using (
--     bucket_id = 'avatars'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- create policy "Avatars are publicly readable"
--   on storage.objects for select
--   using (bucket_id = 'avatars');
