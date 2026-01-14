-- ImpressFlow Database Schema
-- Phase 9: Supabase Integration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- Presentations Table
-- =====================
create table if not exists presentations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('markdown', 'notion-public', 'notion-api')),
  source_content text,
  source_url text,
  theme text not null default 'tech-dark',
  layout text not null default 'spiral',
  html_output text,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'error')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for user queries
create index idx_presentations_user_id on presentations(user_id);
create index idx_presentations_status on presentations(status);

-- =====================
-- Image Cache Table
-- =====================
create table if not exists image_cache (
  id uuid primary key default uuid_generate_v4(),
  prompt_hash text not null unique,
  storage_path text not null,
  prompt_text text,
  style_modifier text,
  width integer default 1024,
  height integer default 1024,
  created_at timestamptz not null default now()
);

-- Index for fast hash lookups
create index idx_image_cache_prompt_hash on image_cache(prompt_hash);

-- =====================
-- Notion Connections Table
-- =====================
create table if not exists notion_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  access_token text not null,
  workspace_id text,
  workspace_name text,
  bot_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One connection per user
create unique index idx_notion_connections_user_id on notion_connections(user_id);

-- =====================
-- Storage Buckets Setup
-- =====================
-- Note: Run these via Supabase dashboard or separate migration
-- insert into storage.buckets (id, name, public) values ('presentations', 'presentations', true);
-- insert into storage.buckets (id, name, public) values ('images', 'images', true);

-- =====================
-- Row Level Security
-- =====================

-- Enable RLS on all tables
alter table presentations enable row level security;
alter table image_cache enable row level security;
alter table notion_connections enable row level security;

-- Presentations: Users can only see their own
create policy "Users can view own presentations"
  on presentations for select
  using (auth.uid() = user_id);

create policy "Users can insert own presentations"
  on presentations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own presentations"
  on presentations for update
  using (auth.uid() = user_id);

create policy "Users can delete own presentations"
  on presentations for delete
  using (auth.uid() = user_id);

-- Image cache: Public read (cached images are shared), authenticated write
create policy "Anyone can view cached images"
  on image_cache for select
  using (true);

create policy "Authenticated users can cache images"
  on image_cache for insert
  with check (auth.role() = 'authenticated');

-- Notion connections: Users can only manage their own
create policy "Users can view own notion connections"
  on notion_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own notion connections"
  on notion_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notion connections"
  on notion_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own notion connections"
  on notion_connections for delete
  using (auth.uid() = user_id);

-- =====================
-- Updated At Trigger
-- =====================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger presentations_updated_at
  before update on presentations
  for each row execute function update_updated_at();

create trigger notion_connections_updated_at
  before update on notion_connections
  for each row execute function update_updated_at();
