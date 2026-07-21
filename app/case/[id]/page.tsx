// Read-only permalink for a single case's full deliberation record. No agent picker, no run
// button — this renders whatever is already in agent_runs for the given case_id, straight
// from Supabase, server-side. Works for any case (seeded or user-submitted) that has been run
// at least once.
import { notFound } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";
import { CaseResultTabs } from "@/src/components/CaseResultTabs";

interface AgentRunRow {
  phase: number;
  agent_doctrine: string;
  framing: string | null;
  doctrinal_analysis: string | null;
  forecast_objective: string | null;
  forecast_projected_outcome: string | null;
  forecast_confidence: string | null;
  verdict: string;
  reasoning: string;
  verdict_changed_from_prior_phase: boolean;
  change_justification: string | null;
  majority_support: string[] | null;
  dissents: { doctrineId: string; position: string; reasoning: string }[] | null;
  reasoning_tensions: { agentA: string; agentB: string; tension: string }[] | null;
  created_at: string;
}

function toAgentRun(r: AgentRunRow) {
  return {
    doctrineId: r.agent_doctrine,
    framing: r.framing ?? "",
    doctrinalAnalysis: r.doctrinal_analysis ?? "",
    forecast: {
      objective: r.forecast_objective ?? "",
      projectedOutcome: r.forecast_projected_outcome ?? "",
      confidence: r.forecast_confidence ?? "medium",
    },
    verdict: r.verdict,
    verdictChangedFromPriorPhase: r.verdict_changed_from_prior_phase,
    changeJustification: r.change_justification ?? undefined,
  };
}

export default async function CasePermalinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: caseRow } = await supabase.from("cases").select("*").eq("id", id).single();
  if (!caseRow) notFound();

  const { data: runs } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  // Keep only the latest row per (phase, agent) — a case may have been rerun with a
  // different agent subset, and the permalink should show the most recent snapshot.
  const latest = new Map<string, AgentRunRow>();
  for (const r of (runs ?? []) as AgentRunRow[]) {
    latest.set(`${r.phase}:${r.agent_doctrine}`, r);
  }

  const phase1Rows = [...latest.values()].filter((r) => r.phase === 1);
  const phase2Rows = [...latest.values()].filter((r) => r.phase === 2);
  const phase3Row = latest.get("3:_aggregator");

  if (phase1Rows.length === 0) {
    return (
      <div>
        <h1 className="case-title">{caseRow.title}</h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>
          This case hasn't been deliberated yet — no results to show.
        </p>
      </div>
    );
  }

  const phase1 = phase1Rows.map(toAgentRun);
  const phase2 = phase2Rows.map(toAgentRun);
  const jointRuling = phase3Row
    ? {
        majorityPosition: phase3Row.verdict,
        majoritySupport: phase3Row.majority_support ?? [],
        dissents: phase3Row.dissents ?? [],
        synthesisNotes: phase3Row.reasoning,
        reasoningTensions: phase3Row.reasoning_tensions ?? [],
      }
    : undefined;

  return (
    <div>
      <p style={{ marginBottom: 8 }}>
        <a href="/" className="back-link">
          ← back to AI Parliament
        </a>
      </p>
      <h1 className="case-title">{caseRow.title}</h1>
      <p className="case-brief">{caseRow.brief}</p>

      <div style={{ marginTop: "1.75rem" }}>
        <CaseResultTabs
          phase1={phase1}
          phase2={phase2.length > 0 ? phase2 : undefined}
          phase3={jointRuling}
          phase2Hint="Final recorded position after cross-examination."
        />
      </div>
    </div>
  );
}
