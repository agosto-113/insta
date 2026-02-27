create extension if not exists pgcrypto;

create table if not exists ig_accounts (
  id uuid primary key default gen_random_uuid(),
  ig_user_id text not null unique,
  username text,
  account_type text,
  profile_picture_url text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ig_tokens (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references ig_accounts(id) on delete cascade,
  access_token text not null,
  token_type text,
  expires_at timestamptz,
  scope text,
  raw_token_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id)
);

create table if not exists account_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references ig_accounts(id) on delete cascade,
  metric_date date not null,
  followers_count integer,
  follows integer,
  reach integer,
  profile_views integer,
  impressions integer,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, metric_date)
);

create table if not exists media_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references ig_accounts(id) on delete cascade,
  ig_media_id text not null unique,
  caption text,
  media_type text,
  media_product_type text,
  permalink text,
  thumbnail_url text,
  media_url text,
  posted_at timestamptz,
  series text,
  slide_count integer,
  content_role text,
  ai_confidence double precision,
  ai_reason text,
  hashtag_set text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table media_items add column if not exists series text;
alter table media_items add column if not exists slide_count integer;
alter table media_items add column if not exists content_role text;
alter table media_items add column if not exists ai_confidence double precision;
alter table media_items add column if not exists ai_reason text;
alter table media_items add column if not exists hashtag_set text;

create table if not exists media_insights_daily (
  id uuid primary key default gen_random_uuid(),
  media_item_id uuid not null references media_items(id) on delete cascade,
  metric_date date not null,
  like_count integer,
  comments_count integer,
  save_count integer,
  shares integer,
  reach integer,
  plays integer,
  impressions integer,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_item_id, metric_date)
);

create or replace view growth_overview as
select
  adm.account_id,
  adm.metric_date,
  adm.followers_count,
  adm.follows,
  adm.reach,
  adm.profile_views,
  adm.impressions,
  lag(adm.followers_count) over (partition by adm.account_id order by adm.metric_date) as prev_followers_count,
  adm.followers_count - lag(adm.followers_count) over (partition by adm.account_id order by adm.metric_date) as follower_net_delta
from account_daily_metrics adm;
