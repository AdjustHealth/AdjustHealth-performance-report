-- Adjust Health Performance Report — saved assessments
-- Run this once in your Supabase project's SQL editor (or via `supabase db push`).

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,

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

alter table assessments enable row level security;

-- Single-tenant internal tool: any signed-in user can read/write any assessment.
-- Tighten this (e.g. filter on created_by) if this ever needs to support more
-- than one clinician with separate caseloads.
create policy "Authenticated users can read assessments"
  on assessments for select
  to authenticated
  using (true);

create policy "Authenticated users can insert assessments"
  on assessments for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update assessments"
  on assessments for update
  to authenticated
  using (true);

create policy "Authenticated users can delete assessments"
  on assessments for delete
  to authenticated
  using (true);

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
