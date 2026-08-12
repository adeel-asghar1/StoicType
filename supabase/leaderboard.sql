-- StoicType global leaderboard
-- Run this once in Supabase SQL Editor.

create table if not exists public.leaderboard (
  name text not null,
  name_normalized text primary key,
  wpm integer not null check (wpm >= 0 and wpm <= 300),
  accuracy integer not null check (accuracy >= 0 and accuracy <= 100),
  errors integer not null check (errors >= 0 and errors <= 1000),
  duration integer not null check (duration >= 1 and duration <= 3600),
  created_at timestamptz not null default now()
);

-- The application accesses this table only through the server-side
-- service-role key. Keep direct client access disabled.
alter table public.leaderboard enable row level security;

revoke all on table public.leaderboard from anon, authenticated;

create index if not exists leaderboard_rank_idx
  on public.leaderboard (wpm desc, accuracy desc, created_at asc);
