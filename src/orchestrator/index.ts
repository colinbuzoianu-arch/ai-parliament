// The orchestrator NEVER calls api.anthropic.com directly. It only ever calls each
// agent's own HTTP route (app/api/agents/<id>/route.ts). This is deliberate: it keeps
// the orchestrator as a pure sequencer, and every model call attributable to a specific,
// separately-deployed agent module.

import { supabase } from "@/src/lib/supabaseClient";
import { aggregate, type AgentRecord } from "@/src/aggregator";

// All 11 modules that exist in src/agents/ - used to validate any requested roster.
export const ALL_DOCTRINE_IDS = [
  "spinoza",
  "kropotkin",
  "weil",
  "solzhenitsyn",
  "ibnrushd",
  "gandhi",
  "boethius",
  "gramsci",
  "diogenes",
  "luxemburg",
  "laboetie",
] as const;

// The 9-agent default roster. Luxemburg and La Boetie are deliberately excluded by
// default (heavy doctrinal overlap with Kropotkin and Gramsci respectively) but remain
// fully available per-case via activeDoctrines.
export const DEFAULT_DOCTRINE_IDS = [
  "spinoza",
  "weil",
  "solzhenitsyn",
  "ibnrushd",
  "gandhi",
  "boethius",
  "kropotkin",
  "gramsci",
  "diogenes",
] as const;

export type DoctrineId = (typeof ALL_DOCTRINE_IDS)[number];

interface RunOptions {
  caseId: string;
  caseBrief: string;
  /** Subset of ALL_DOCTRINE_IDS. Defaults to all 9 if omitted. */
  activeDoctrines?: DoctrineId[];
  /** How many Phase 2 cross-examination rounds to run. Default 2, capped at 3. */
  phase2Rounds?: number;
  baseUrl: string; // e.g. https://your-deployment.vercel.app — needed for server-to-route fetches
}

async function callAgent(baseUrl: string, doctrineId: string, payload: unknown) {
  const res = await fetch(`${baseUrl}/api/agents/${doctrineId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Agent ${doctrineId} route failed: ${res.status}`);
  return res.json() as Promise<AgentRecord>;
}

async function logRun(caseId: string, phase: number, record: AgentRecord, isPublic = false) {
  const { error } = await supabase.from("agent_runs").insert({
    case_id: caseId,
    phase,
    agent_doctrine: record.doctrineId,
    framing: (record as any).framing ?? null,
    doctrinal_analysis: (record as any).doctrinalAnalysis ?? null,
    forecast_objective: (record as any).forecast?.objective ?? null,
    forecast_projected_outcome: (record as any).forecast?.projectedOutcome ?? null,
    forecast_confidence: (record as any).forecast?.confidence ?? null,
    verdict: record.verdict,
    reasoning: record.reasoning,
    verdict_changed_from_prior_phase: record.verdictChangedFromPriorPhase,
    change_justification: record.changeJustification ?? null,
    is_public: isPublic,
  });
  // Insert-only table: if this fails, do not retry with an update — surface the error.
  if (error) throw new Error(`Audit log insert failed: ${error.message}`);
}

export async function runDeliberation(opts: RunOptions) {
  const roster = opts.activeDoctrines?.length ? opts.activeDoctrines : ALL_DOCTRINE_IDS;
  const phase2Rounds = Math.min(opts.phase2Rounds ?? 2, 3);

  // Phase 1 — independent reasoning, fully isolated, no agent sees another's output.
  const phase1Results: AgentRecord[] = await Promise.all(
    roster.map((id) =>
      callAgent(opts.baseUrl, id, {
        caseId: opts.caseId,
        phase: 1,
        caseBrief: opts.caseBrief,
      }).then(async (r) => {
        await logRun(opts.caseId, 1, r);
        return r;
      })
    )
  );

  // Phase 2 — bounded cross-examination rounds. Each round, every agent sees the
  // FULL current set of positions (from the prior round) and may revise, via a
  // fresh isolated call each time — no shared memory between calls.
  let currentPositions = phase1Results;
  for (let round = 0; round < phase2Rounds; round++) {
    currentPositions = await Promise.all(
      roster.map((id) => {
        const priorPositions = currentPositions
          .filter((p) => p.doctrineId !== id)
          .map((p) => ({ doctrineId: p.doctrineId, verdict: p.verdict, reasoning: p.reasoning }));
        return callAgent(opts.baseUrl, id, {
          caseId: opts.caseId,
          phase: 2,
          caseBrief: opts.caseBrief,
          priorPositions,
        }).then(async (r) => {
          await logRun(opts.caseId, 2, r);
          return r;
        });
      })
    );
  }

  // Phase 3 — a SIXTH, separate aggregator (not one of the 9) synthesizes a joint
  // ruling: majority + attributed dissents. No forced consensus.
  const jointRuling = await aggregate(opts.caseId, currentPositions);

  const { error } = await supabase.from("agent_runs").insert({
    case_id: opts.caseId,
    phase: 3,
    agent_doctrine: "_aggregator",
    verdict: jointRuling.majorityPosition,
    reasoning: jointRuling.synthesisNotes,
    verdict_changed_from_prior_phase: false,
    change_justification: null,
    majority_support: jointRuling.majoritySupport,
    dissents: jointRuling.dissents,
    reasoning_tensions: jointRuling.reasoningTensions,
  });
  if (error) throw new Error(`Audit log insert failed (phase 3): ${error.message}`);

  return {
    phase1: phase1Results,
    phase2Final: currentPositions,
    phase3: jointRuling,
  };
}

// --- Public sandbox path ---
// Phase 1 does not depend on roster (agents don't see each other), so for seeded/public
// cases it's precomputed once (see scripts/seed-cases.mjs) and cached in phase1_cache.
// This function reads that cache and only runs Phase 2 (single round, cost-capped) and
// Phase 3 live, per visitor's chosen subset of agents.

interface PublicRunOptions {
  caseId: string;
  caseBrief: string;
  activeDoctrines: DoctrineId[];
  baseUrl: string;
}

const DAILY_CAPS: Record<"rerun" | "submission", number> = {
  rerun: 40,
  submission: 15,
};

export async function checkAndIncrementDailyUsage(
  kind: "rerun" | "submission"
): Promise<{ allowed: boolean; count: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const cap = DAILY_CAPS[kind];
  const { data: existing } = await supabase
    .from("public_usage")
    .select("*")
    .eq("day", today)
    .eq("kind", kind)
    .maybeSingle();

  if (!existing) {
    await supabase.from("public_usage").insert({ day: today, kind, run_count: 1 });
    return { allowed: true, count: 1 };
  }
  if (existing.run_count >= cap) {
    return { allowed: false, count: existing.run_count };
  }
  await supabase
    .from("public_usage")
    .update({ run_count: existing.run_count + 1 })
    .eq("day", today)
    .eq("kind", kind);
  return { allowed: true, count: existing.run_count + 1 };
}

export async function runPublicDeliberation(opts: PublicRunOptions) {
  const roster = opts.activeDoctrines;

  const { data: cachedRows, error: cacheError } = await supabase
    .from("phase1_cache")
    .select("*")
    .eq("case_id", opts.caseId)
    .in("doctrine_id", roster);

  if (cacheError) throw new Error(`Failed to load phase1 cache: ${cacheError.message}`);

  const cachedIds = new Set((cachedRows ?? []).map((r: any) => r.doctrine_id));
  const missingIds = roster.filter((id) => !cachedIds.has(id));

  // Any agent not yet cached for this case runs Phase 1 live now, then gets cached —
  // this is what lets a brand-new user-submitted case work with no pre-seeding step,
  // while still making every subsequent request for the same case/agent free.
  const freshResults: AgentRecord[] = await Promise.all(
    missingIds.map((id) =>
      callAgent(opts.baseUrl, id, { caseId: opts.caseId, phase: 1, caseBrief: opts.caseBrief }).then(
        async (r) => {
          await supabase.from("phase1_cache").upsert({
            case_id: opts.caseId,
            doctrine_id: r.doctrineId,
            framing: (r as any).framing,
            doctrinal_analysis: (r as any).doctrinalAnalysis,
            forecast_objective: (r as any).forecast?.objective,
            forecast_projected_outcome: (r as any).forecast?.projectedOutcome,
            forecast_confidence: (r as any).forecast?.confidence,
            verdict: r.verdict,
            reasoning: r.reasoning,
          });
          await logRun(opts.caseId, 1, r, true);
          return r;
        }
      )
    )
  );

  const cachedResults: AgentRecord[] = (cachedRows ?? []).map((row: any) => ({
    doctrineId: row.doctrine_id,
    framing: row.framing,
    doctrinalAnalysis: row.doctrinal_analysis,
    forecast: {
      objective: row.forecast_objective,
      projectedOutcome: row.forecast_projected_outcome,
      confidence: row.forecast_confidence,
    },
    verdict: row.verdict,
    reasoning: row.reasoning,
    verdictChangedFromPriorPhase: false,
  }));

  const phase1Results: AgentRecord[] = [...cachedResults, ...freshResults];

  // Phase 2 — exactly one live round for the public sandbox (cost control).
  const currentPositions: AgentRecord[] = await Promise.all(
    roster.map((id) => {
      const priorPositions = phase1Results
        .filter((p) => p.doctrineId !== id)
        .map((p) => ({ doctrineId: p.doctrineId, verdict: p.verdict, reasoning: p.reasoning }));
      return callAgent(opts.baseUrl, id, {
        caseId: opts.caseId,
        phase: 2,
        caseBrief: opts.caseBrief,
        priorPositions,
      }).then(async (r) => {
        await logRun(opts.caseId, 2, r, true);
        return r;
      });
    })
  );

  // Phase 3 — live aggregation.
  const jointRuling = await aggregate(opts.caseId, currentPositions);
  await supabase.from("agent_runs").insert({
    case_id: opts.caseId,
    phase: 3,
    agent_doctrine: "_aggregator",
    verdict: jointRuling.majorityPosition,
    reasoning: jointRuling.synthesisNotes,
    verdict_changed_from_prior_phase: false,
    majority_support: jointRuling.majoritySupport,
    dissents: jointRuling.dissents,
    reasoning_tensions: jointRuling.reasoningTensions,
    is_public: true,
  });

  return {
    phase1: phase1Results,
    phase2Final: currentPositions,
    phase3: jointRuling,
  };
}
