-- Funnel schema v1. Applied by `npm run db:migrate` (production) or
-- automatically on first use of the local PGlite database (development).
-- All timestamps are timestamptz (UTC); display zone is Europe/Istanbul.

create extension if not exists btree_gist;

create table team_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'closer')),
  password_hash text,
  session_version integer not null default 1,
  active boolean not null default true,
  accepts_bookings boolean not null default false,
  weekly_hours jsonb,
  max_per_day integer,
  google_email text,
  google_refresh_token_enc text,
  google_calendar_id text not null default 'primary',
  google_connected_at timestamptz,
  google_last_error text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  first_name text,
  last_name text,
  email text not null,
  phone text not null,
  instagram text,
  answers jsonb not null,
  score integer not null,
  tier text check (tier in ('A', 'B', 'C')),
  qualified boolean not null,
  disqualify_reason text,
  status text not null check (status in (
    'disqualified', 'qualified', 'booked', 'attended', 'no_show', 'won', 'lost', 'cancelled'
  )),
  apply_count integer not null default 1,
  last_applied_at timestamptz not null default now(),
  kvkk_consent_at timestamptz not null,
  marketing_consent boolean not null default false,
  first_touch jsonb,
  last_touch jsonb,
  fbclid text,
  fbc text,
  fbp text,
  landing_url text,
  referrer text,
  ip text,
  user_agent text,
  owner_id uuid references team_members (id) on delete set null,
  deal_value numeric(12, 2),
  currency text not null default 'TRY',
  closed_at timestamptz,
  lost_reason text,
  notes text
);

create index leads_created_at_idx on leads (created_at desc);
create index leads_email_idx on leads (email);
create index leads_phone_idx on leads (phone);
create index leads_status_idx on leads (status);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  host_id uuid not null references team_members (id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'rescheduled')),
  meeting_mode text not null default 'google_meet' check (meeting_mode in ('google_meet', 'phone')),
  google_event_id text,
  meet_url text,
  google_sync_error text,
  reminder_24h_sent_at timestamptz,
  reminder_1h_sent_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  rescheduled_from uuid references bookings (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_valid check (end_at > start_at),
  -- The database itself makes double booking impossible: two confirmed
  -- bookings of one host can never overlap, even under concurrent requests.
  constraint bookings_no_overlap exclude using gist (
    host_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status = 'confirmed')
);

-- One upcoming call per lead.
create unique index bookings_one_active_per_lead on bookings (lead_id) where status = 'confirmed';
create index bookings_start_at_idx on bookings (start_at);
create index bookings_host_start_idx on bookings (host_id, start_at);

-- Every Meta Conversions API attempt, so the panel can show "reached Meta ✓".
create table lead_events (
  id bigint generated always as identity primary key,
  lead_id uuid references leads (id) on delete cascade,
  event_name text not null,
  event_id text not null,
  action_source text not null,
  value numeric(12, 2),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  skip_reason text,
  events_received integer,
  fbtrace_id text,
  error text,
  test_event_code text,
  created_at timestamptz not null default now()
);

create index lead_events_lead_idx on lead_events (lead_id, created_at desc);
create index lead_events_event_id_idx on lead_events (event_id);

-- Timeline: applications, bookings, outcomes, notes, notifications.
create table lead_activity (
  id bigint generated always as identity primary key,
  lead_id uuid not null references leads (id) on delete cascade,
  actor_id uuid references team_members (id) on delete set null,
  kind text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index lead_activity_lead_idx on lead_activity (lead_id, created_at desc);

-- Fixed-window rate limiting shared across serverless instances.
create table rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);

-- Supabase exposes the public schema through its REST API. The app talks to
-- Postgres directly as the table owner (which bypasses RLS), so enabling RLS
-- without any policy closes every table to the anon/authenticated API keys.
alter table team_members enable row level security;
alter table leads enable row level security;
alter table bookings enable row level security;
alter table lead_events enable row level security;
alter table lead_activity enable row level security;
alter table rate_limits enable row level security;
