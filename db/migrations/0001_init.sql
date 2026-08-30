-- Adjust Health Performance Report — saved assessments
-- Run this once against your Postgres database (Vercel Postgres / Neon SQL
-- editor, or `psql "$DATABASE_URL" -f db/migrations/0001_init.sql`).

create extension if not exists pgcrypto;

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Denormalized summary columns for the list page — kept in sync on every save
  -- from the tool's own computed report, never recomputed server-side.
  athlete_name text not null default 'Unnamed Athlete',
  assess_type text not null check (assess_type in ('performance', 'youth', 'movestrong')),
  youth_tier text check (youth_tier in ('y1', 'y2') or youth_tier is null),
  clinician text,
  assessment_date date,
  overall_score numeric,

  -- The full form state, exactly what the tool's own save/restore already uses —
  -- reusing that shape means the tool never needs a second serialization format.
  form_data jsonb not null
);

create index if not exists assessments_created_at_idx on assessments (created_at desc);

-- No row-level security here: this is a single-tenant internal tool with one
-- shared login, and the database is never reached directly from the browser —
-- only from server-side code behind the app's own password gate (see
-- proxy.ts / lib/auth.ts). Access control lives at the app layer, not the DB.

-- Keep updated_at current on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists assessments_set_updated_at on assessments;
create trigger assessments_set_updated_at
  before update on assessments
  for each row
  execute function set_updated_at();
