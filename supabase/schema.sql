-- AI Parliament schema
-- Design principle: agent_runs is append-only. No UPDATE, no DELETE, ever.
-- This is what makes the log an audit trail rather than just a table.

create table if not exists doctrines (
  id text primary key,               -- e.g. 'spinoza'
  name text not null,
  years text not null,
  stance text not null,
  renunciation_basis text not null,
  corpus_version text not null,      -- bump this whenever doctrine.md changes
  is_default boolean not null default true,  -- false for luxemburg/laboetie: per-case only
  created_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brief text not null,
  active_doctrines text[] not null,  -- subset (or all) of doctrines.id, chosen at creation
  phase2_rounds int not null default 2,
  is_seeded boolean not null default false,   -- true for cases created via scripts/seed-cases.mjs
  is_public boolean not null default false,   -- true = shown in the public sandbox gallery
  source text not null default 'seeded',      -- 'seeded' | 'user_submitted'
  created_at timestamptz not null default now()
);

-- Precomputed Phase 1 (independent reasoning) per public case, per agent. Phase 1 does not
-- depend on which agents are in a given visitor's chosen roster, so once an agent has been
-- run on a given case (whether at seed time or by the first visitor to request it), the
-- result is cached and reused for everyone after. Only Phase 2/3 (and any not-yet-cached
-- agent's Phase 1) run live per visitor request.
create table if not exists phase1_cache (
  case_id uuid not null references cases(id),
  doctrine_id text not null,
  framing text,
  doctrinal_analysis text,
  forecast_objective text,
  forecast_projected_outcome text,
  forecast_confidence text,
  verdict text not null,
  reasoning text not null,
  created_at timestamptz not null default now(),
  primary key (case_id, doctrine_id)
);

-- Daily counters capping live activity from the public sandbox, split by kind since a
-- custom case submission (which may trigger several fresh Phase 1 calls) is more expensive
-- than a rerun against an already-cached case (Phase 2/3 only).
create table if not exists public_usage (
  day date not null default current_date,
  kind text not null,          -- 'rerun' | 'submission'
  run_count int not null default 0,
  primary key (day, kind)
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id),
  phase int not null check (phase in (1, 2, 3)),
  agent_doctrine text not null,       -- doctrines.id, or '_aggregator' for phase 3
  -- Four-stage output contract (pre-commitment auditing): each stage is locked once
  -- the next is written. forecast_* is written BEFORE verdict and never edited after.
  framing text,
  doctrinal_analysis text,
  forecast_objective text,
  forecast_projected_outcome text,
  forecast_confidence text,
  verdict text not null,
  reasoning text not null,            -- flat concatenation, kept for quick display/back-compat
  verdict_changed_from_prior_phase boolean not null default false,
  change_justification text,
  model text not null default 'claude-sonnet-4-6',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enforce append-only at the database level, not just in application code.
-- Revoke UPDATE/DELETE from the roles the app uses; only INSERT and SELECT remain.
revoke update, delete on agent_runs from public;
revoke update, delete on agent_runs from authenticated;
revoke update, delete on agent_runs from anon;

-- If using Supabase's default `service_role`, that role bypasses RLS/grants by default.
-- To truly enforce insert-only even for the service role, run agent_runs writes through
-- a dedicated Postgres role with only INSERT+SELECT granted, and use that role's
-- connection string in SUPABASE_SERVICE_ROLE_KEY equivalent for this table specifically.
-- (Documented as a TODO in README — Supabase's service_role bypass is a known caveat.)

create index if not exists idx_agent_runs_case_id on agent_runs(case_id);
create index if not exists idx_agent_runs_phase on agent_runs(phase);
