-- =============================================================
-- Migration: Add sections, contacts, fonts, backgrounds, layouts
-- Run AFTER schema.sql + seed.sql
-- =============================================================

-- 1. New columns on profiles
alter table public.profiles
  add column if not exists header_mode text not null default 'AVATAR'
    check (header_mode in ('AVATAR', 'HERO', 'AVATAR_HERO')),
  add column if not exists hero_url text,
  add column if not exists hero_position text not null default 'center'
    check (hero_position in ('center', 'top')),
  add column if not exists display_title text,
  add column if not exists background_id text not null default 'solid-white',
  add column if not exists font_id text not null default 'inter',
  add column if not exists main_links_layout text not null default 'LIST_ICON'
    check (main_links_layout in (
      'LIST_ICON', 'GRID_ICON', 'GRID_IMAGE', 'LIST_IMAGE'
    ));

-- 2. New columns on links
alter table public.links
  add column if not exists image_url text,
  add column if not exists platform text;

-- 3. Profile contacts table
create table if not exists public.profile_contacts (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  type         text not null
                 check (type in (
                   'whatsapp', 'telegram', 'phone', 'email',
                   'instagram', 'tiktok'
                 )),
  value        text not null,
  order_index  int not null default 0,
  is_enabled   boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists idx_contacts_profile
  on public.profile_contacts (profile_id, order_index);

-- 4. Fonts table
create table if not exists public.fonts (
  id       text primary key,
  name     text not null,
  family   text not null,
  is_pro   boolean not null default false,
  url      text -- Google Fonts URL (null = system font)
);

-- 5. Backgrounds table
create table if not exists public.backgrounds (
  id       text primary key,
  name     text not null,
  type     text not null check (type in ('solid', 'gradient', 'pattern')),
  value    text not null, -- CSS value
  is_pro   boolean not null default false
);

-- 6. RLS for new tables
alter table public.profile_contacts enable row level security;
alter table public.fonts enable row level security;
alter table public.backgrounds enable row level security;

-- Contacts: owner CRUD
create policy "Owner can manage own contacts"
  on public.profile_contacts for all
  using (
    exists (
      select 1 from public.profiles
      where id = profile_contacts.profile_id
        and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = profile_contacts.profile_id
        and owner_id = auth.uid()
    )
  );

-- Contacts: public read for enabled contacts of public profiles
create policy "Public can read enabled contacts"
  on public.profile_contacts for select
  using (
    is_enabled = true
    and exists (
      select 1 from public.profiles
      where id = profile_contacts.profile_id
        and deleted_at is null
    )
  );

-- Fonts: public read
create policy "Anyone can read fonts"
  on public.fonts for select
  using (true);

-- Backgrounds: public read
create policy "Anyone can read backgrounds"
  on public.backgrounds for select
  using (true);

-- 7. Seed fonts
insert into public.fonts (id, name, family, is_pro, url) values
  ('inter', 'Inter', '''Inter'', sans-serif', false,
   'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'),
  ('dm-sans', 'DM Sans', '''DM Sans'', sans-serif', false,
   'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'),
  ('plus-jakarta', 'Plus Jakarta Sans', '''Plus Jakarta Sans'', sans-serif', false,
   'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'),
  ('space-grotesk', 'Space Grotesk', '''Space Grotesk'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'),
  ('outfit', 'Outfit', '''Outfit'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap'),
  ('sora', 'Sora', '''Sora'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap'),
  ('space-mono', 'Space Mono', '''Space Mono'', monospace', true,
   'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'),
  ('playfair', 'Playfair Display', '''Playfair Display'', serif', true,
   'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap'),
  ('jetbrains', 'JetBrains Mono', '''JetBrains Mono'', monospace', true,
   'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap'),
  ('cabinet', 'Cabinet Grotesk', '''Cabinet Grotesk'', sans-serif', true,
   'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap')
on conflict (id) do nothing;

-- 8. Seed backgrounds
insert into public.backgrounds (id, name, type, value, is_pro) values
  ('solid-white', 'White', 'solid', '#ffffff', false),
  ('solid-gray', 'Light Gray', 'solid', '#f3f4f6', false),
  ('solid-dark', 'Dark', 'solid', '#0f172a', false),
  ('solid-black', 'Black', 'solid', '#000000', false),
  ('gradient-sunset', 'Sunset', 'gradient',
   'linear-gradient(135deg, #f97316, #ec4899)', true),
  ('gradient-ocean', 'Ocean', 'gradient',
   'linear-gradient(180deg, #0ea5e9, #6366f1)', true),
  ('gradient-candy', 'Candy', 'gradient',
   'linear-gradient(135deg, #f472b6, #a78bfa)', true),
  ('gradient-emerald', 'Emerald', 'gradient',
   'linear-gradient(135deg, #10b981, #059669)', true),
  ('gradient-midnight', 'Midnight', 'gradient',
   'linear-gradient(135deg, #1e1b4b, #312e81)', true),
  ('gradient-peach', 'Peach', 'gradient',
   'linear-gradient(135deg, #fbbf24, #f472b6)', true),
  ('pattern-dots', 'Dots', 'pattern',
   'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', false),
  ('pattern-grid', 'Grid', 'pattern',
   'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', true),
  ('pattern-diagonal', 'Diagonal', 'pattern',
   'repeating-linear-gradient(45deg, transparent, transparent 10px, #f3f4f6 10px, #f3f4f6 11px)', true)
on conflict (id) do nothing;

-- 9. Add contact_clicks to daily_profile_stats
alter table public.daily_profile_stats
  add column if not exists contact_clicks int not null default 0;
