-- Run once in Supabase: SQL Editor -> New query -> paste -> Run

-- 1. Admin flag on users
alter table users add column if not exists is_admin boolean not null default false;

-- 2. Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),

  -- Basics
  title text not null,
  flavour text not null default '',
  size text not null default '',
  mrp numeric(10, 2) not null check (mrp > 0),
  price numeric(10, 2) not null check (price > 0),
  in_stock boolean not null default true,
  sort_order integer not null default 0,

  -- Page content
  slug text not null unique,
  h1 text not null,
  h2 text not null default '',
  description text not null default '',
  highlights_heading text not null default '',
  highlights jsonb not null default '[]',
  nutrition_heading text not null default '',
  nutrition jsonb not null default '[]',
  usage_heading text not null default '',
  usage text not null default '',

  -- SEO
  meta_title text not null,
  meta_description text not null,

  -- Images: [{"key": "images/products/....webp", "alt": "..."}], first one is the main image
  images jsonb not null default '[]',

  -- Publishing
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_status_sort_idx on products (status, sort_order);

-- Keep Supabase's public API away from this table (the backend connects directly)
alter table products enable row level security;

-- 3. Make your own account an admin (use the email you registered with)
-- update users set is_admin = true where email = 'you@example.com';