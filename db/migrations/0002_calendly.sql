-- Calendly replaces the in-house calendar. Calendly now owns availability,
-- double-booking protection, confirmations and reminders; `bookings` mirrors
-- its invitees so the panel can show the agenda, tie the sale to the lead
-- and send Meta events with the identity captured at application time.

alter table bookings drop constraint if exists bookings_no_overlap;
alter table bookings drop constraint if exists bookings_time_valid;
alter table bookings drop constraint if exists bookings_host_id_fkey;

alter table bookings
  drop column if exists meeting_mode,
  drop column if exists google_event_id,
  drop column if exists meet_url,
  drop column if exists google_sync_error,
  drop column if exists reminder_24h_sent_at,
  drop column if exists reminder_1h_sent_at,
  -- A funnel booking can be recorded before the Calendly API key exists;
  -- the hourly sync fills in time and host later.
  alter column host_id drop not null,
  alter column start_at drop not null,
  alter column end_at drop not null,
  add column source text not null default 'funnel' check (source in ('funnel', 'webhook', 'sync')),
  add column calendly_event_uri text,
  add column calendly_invitee_uri text,
  add column host_name text,
  add column host_email text,
  add column location text,
  add column join_url text,
  add column cancel_url text,
  add column reschedule_url text,
  add column calendly_updated_at timestamptz;

alter table bookings
  add constraint bookings_time_valid check (start_at is null or end_at is null or end_at > start_at),
  add constraint bookings_host_id_fkey foreign key (host_id) references team_members (id) on delete set null,
  -- One row per Calendly invitee: webhook, sync and the funnel all upsert on it.
  add constraint bookings_calendly_invitee_key unique (calendly_invitee_uri);

create index bookings_calendly_event_idx on bookings (calendly_event_uri);

-- Working hours and Google Calendar connections now live in Calendly.
alter table team_members
  drop column if exists weekly_hours,
  drop column if exists max_per_day,
  drop column if exists google_email,
  drop column if exists google_refresh_token_enc,
  drop column if exists google_calendar_id,
  drop column if exists google_connected_at,
  drop column if exists google_last_error;
