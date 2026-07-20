// Read-only permalink for a single case's full deliberation record. No agent picker, no run
// button — this renders whatever is already in agent_runs for the given case_id, straight
// from Supabase, server-side. Works for any case (seeded or user-submitted) that has been run
// at least once.
import { notFound } from "next/navigation";
import { supabase } from "@/src/lib/supabaseClient";
import { DisagreementMap } from "@/src/components/DisagreementMap";

const LABELS: Record<string, string> = {
  spinoza: "Spinoza", weil: "Weil", solzhenitsyn: "Solzhenitsyn", ibnrushd: "Ibn Rushd",
  gandhi: "Gandhi", boethius: "Boethius", kropotkin: "Kropotkin", gramsci: "Gramsci",
  diogenes: "Diogenes", luxemburg: "Luxemburg", laboetie: "La Boetie",
};

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
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>{caseRow.title}</h1>
        <p style={{ fontSize: 14, color: "#666" }}>
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
    : null;

  return (
    <div>
      <p style={{ fontSize: 13 }}>
        <a href="/sandbox" style={{ color: "#666" }}>
          ← back to sandbox
        </a>
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>{caseRow.title}</h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#333" }}>{caseRow.brief}</p>

      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: "2rem" }}>Phase 1 — independent reasoning</h2>
      {phase1.map((run) => (
        <AgentBlock key={run.doctrineId} run={run} />
      ))}

      {phase2.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: "2rem" }}>Phase 2 — after cross-examination</h2>
          {phase2.map((run) => (
            <AgentBlock key={run.doctrineId + "-p2"} run={run} showChange />
          ))}
        </>
      )}

      {jointRuling && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: "2rem" }}>Phase 3 — joint ruling</h2>
          <div style={{ background: "#f7f7f5", borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px" }}>Majority position</p>
            <p style={{ fontSize: 14, margin: 0 }}>{jointRuling.majorityPosition}</p>
            {jointRuling.majoritySupport.length > 0 && (
              <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                Supported by: {jointRuling.majoritySupport.map((d) => LABELS[d] ?? d).join(", ")}
              </p>
            )}
          </div>

          <p style={{ fontSize: 12, color: "#666", margin: "1.5rem 0 6px" }}>Disagreement map</p>
          <DisagreementMap agentRuns={phase2.length > 0 ? phase2 : phase1} jointRuling={jointRuling} labels={LABELS} />

          <p style={{ fontSize: 12, color: "#666", margin: "1.5rem 0 6px" }}>Full synthesis / dissents</p>
          <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{jointRuling.synthesisNotes}</p>
        </>
      )}
    </div>
  );
}

function AgentBlock({
  run,
  showChange,
}: {
  run: ReturnType<typeof toAgentRun>;
  showChange?: boolean;
}) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, marginBottom: 8, padding: "10px 14px" }}>
      <p style={{ margin: "0 0 8px" }}>
        <strong style={{ fontWeight: 500 }}>{LABELS[run.doctrineId] ?? run.doctrineId}</strong>
        {showChange && (
          <span style={{ fontSize: 12, color: run.verdictChangedFromPriorPhase ? "#a70" : "#999", marginLeft: 8 }}>
            {run.verdictChangedFromPriorPhase ? "revised position" : "held position"}
          </span>
        )}
      </p>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        <Stage label="Framing" text={run.framing} />
        <Stage label="Doctrinal analysis" text={run.doctrinalAnalysis} />
        <Stage
          label="Forecast"
          text={`Objective: ${run.forecast.objective}\nProjected outcome: ${run.forecast.projectedOutcome}\nConfidence: ${run.forecast.confidence}`}
        />
        <Stage label="Verdict" text={run.verdict} />
        {run.changeJustification && <Stage label="Change justification" text={run.changeJustification} />}
      </div>
    </div>
  );
}

function Stage({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: "#666", margin: "0 0 2px" }}>{label}</p>
      <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{text}</p>
    </div>
  );
}
