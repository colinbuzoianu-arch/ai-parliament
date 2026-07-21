"use client";

import { useState } from "react";
import { DisagreementMap } from "@/src/components/DisagreementMap";

const DEFAULT_ROSTER = [
  "spinoza",
  "weil",
  "solzhenitsyn",
  "ibnrushd",
  "gandhi",
  "boethius",
  "kropotkin",
  "gramsci",
  "diogenes",
];
const ALL_AGENTS = [...DEFAULT_ROSTER, "luxemburg", "laboetie"];

const LABELS: Record<string, string> = {
  spinoza: "Spinoza",
  weil: "Weil",
  solzhenitsyn: "Solzhenitsyn",
  ibnrushd: "Ibn Rushd",
  gandhi: "Gandhi",
  boethius: "Boethius",
  kropotkin: "Kropotkin",
  gramsci: "Gramsci",
  diogenes: "Diogenes",
  luxemburg: "Luxemburg",
  laboetie: "La Boetie",
};

interface AgentRun {
  doctrineId: string;
  framing: string;
  doctrinalAnalysis: string;
  forecast: { objective: string; projectedOutcome: string; confidence: string };
  verdict: string;
  verdictChangedFromPriorPhase: boolean;
  changeJustification?: string;
}

interface RunResult {
  phase1: AgentRun[];
  phase2Final: AgentRun[];
  phase3: {
    majorityPosition: string;
    majoritySupport: string[];
    dissents: { doctrineId: string; position: string; reasoning: string }[];
    reasoningTensions: { agentA: string; agentB: string; tension: string }[];
    synthesisNotes: string;
  };
}

const PHASE_STATUS: Record<1 | 2 | 3, string> = {
  1: "The agents are independently reviewing the case…",
  2: "Cross-examining each other's positions…",
  3: "Reaching a joint verdict…",
};

export default function Page() {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [roster, setRoster] = useState<Set<string>>(new Set(DEFAULT_ROSTER));
  const [phase2Rounds, setPhase2Rounds] = useState(2);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [runningPhase, setRunningPhase] = useState<1 | 2 | 3 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  function toggleAgent(id: string) {
    const next = new Set(roster);
    next.has(id) ? next.delete(id) : next.add(id);
    setRoster(next);
  }

  function toggleExpanded(id: string) {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  }

  async function runCase() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const caseRes = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          brief,
          activeDoctrines: Array.from(roster),
          phase2Rounds,
        }),
      });
      const caseData = await caseRes.json();
      if (!caseRes.ok) throw new Error(caseData.error ?? "Failed to create case");
      const caseId = caseData.id;

      setRunningPhase(1);
      const phase1Res = await fetch("/api/orchestrate/phase1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const phase1Data = await phase1Res.json();
      if (!phase1Res.ok) throw new Error(phase1Data.error ?? "Phase 1 failed");

      setRunningPhase(2);
      const phase2Res = await fetch("/api/orchestrate/phase2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, phase1: phase1Data.phase1 }),
      });
      const phase2Data = await phase2Res.json();
      if (!phase2Res.ok) throw new Error(phase2Data.error ?? "Phase 2 failed");

      setRunningPhase(3);
      const phase3Res = await fetch("/api/orchestrate/phase3", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, phase2Final: phase2Data.phase2Final }),
      });
      const phase3Data = await phase3Res.json();
      if (!phase3Res.ok) throw new Error(phase3Data.error ?? "Phase 3 failed");

      setResult({
        phase1: phase1Data.phase1,
        phase2Final: phase2Data.phase2Final,
        phase3: phase3Data.phase3,
      });
      setActiveTab(1);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setRunningPhase(null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>AI Parliament</h1>

      <label style={{ display: "block", margin: "1rem 0 4px", fontSize: 13, color: "#666" }}>
        Case title
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 8, fontSize: 14 }}
        placeholder="e.g. Municipal broadband subsidy proposal"
      />

      <label style={{ display: "block", margin: "1rem 0 4px", fontSize: 13, color: "#666" }}>
        Case brief
      </label>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={6}
        style={{ width: "100%", padding: 8, fontSize: 14 }}
        placeholder="Paste the policy or project text here..."
      />

      <p style={{ fontSize: 13, color: "#666", margin: "1rem 0 6px" }}>Agents in this case</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
        {ALL_AGENTS.map((id) => (
          <button
            key={id}
            onClick={() => toggleAgent(id)}
            style={{
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 6,
              border: roster.has(id) ? "1px solid #4a7" : "1px solid #ccc",
              background: roster.has(id) ? "#eef8f2" : "transparent",
              cursor: "pointer",
            }}
          >
            {LABELS[id]}
            {!DEFAULT_ROSTER.includes(id) && (
              <span style={{ color: "#999" }}> (extra)</span>
            )}
          </button>
        ))}
      </div>

      <label style={{ display: "block", margin: "0 0 4px", fontSize: 13, color: "#666" }}>
        Phase 2 rounds
      </label>
      <select
        value={phase2Rounds}
        onChange={(e) => setPhase2Rounds(Number(e.target.value))}
        style={{ padding: 6, marginBottom: "1rem" }}
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
      </select>

      <div>
        <button
          onClick={runCase}
          disabled={loading || !title || !brief || roster.size === 0}
          style={{ padding: "8px 16px", fontSize: 14, cursor: "pointer" }}
        >
          {loading ? "Running deliberation..." : "Run deliberation"}
        </button>
        {loading && runningPhase && (
          <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>{PHASE_STATUS[runningPhase]}</p>
        )}
      </div>

      {error && <p style={{ color: "#a33", marginTop: "1rem" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #ddd", marginBottom: "1rem" }}>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setActiveTab(p as 1 | 2 | 3)}
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  border: "none",
                  borderBottom: activeTab === p ? "2px solid #333" : "2px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: activeTab === p ? 500 : 400,
                }}
              >
                {p === 1 ? "Independent reasoning" : p === 2 ? "Cross-examination" : "Joint verdict"}
              </button>
            ))}
          </div>

          {activeTab === 1 && (
            <div>
              {result.phase1.map((run) => (
                <AgentCard
                  key={run.doctrineId}
                  run={run}
                  open={expanded.has(run.doctrineId)}
                  onToggle={() => toggleExpanded(run.doctrineId)}
                />
              ))}
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                Final position after {phase2Rounds} round(s) of cross-examination.
              </p>
              {result.phase2Final.map((run) => (
                <AgentCard
                  key={run.doctrineId}
                  run={run}
                  open={expanded.has(run.doctrineId + "-p2")}
                  onToggle={() => toggleExpanded(run.doctrineId + "-p2")}
                  showChange
                />
              ))}
            </div>
          )}

          {activeTab === 3 && (
            <div>
              <div style={{ background: "#f7f7f5", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px" }}>Majority position</p>
                <p style={{ fontSize: 14, margin: 0 }}>{result.phase3.majorityPosition}</p>
                {result.phase3.majoritySupport?.length > 0 && (
                  <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                    Supported by: {result.phase3.majoritySupport.map((id) => LABELS[id] ?? id).join(", ")}
                  </p>
                )}
              </div>

              <p style={{ fontSize: 12, color: "#666", margin: "1.5rem 0 6px" }}>Disagreement map</p>
              <DisagreementMap
                agentRuns={result.phase2Final}
                jointRuling={result.phase3}
                labels={LABELS}
              />

              <p style={{ fontSize: 12, color: "#666", margin: "1.5rem 0 6px" }}>Full synthesis / dissents</p>
              <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{result.phase3.synthesisNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentCard({
  run,
  open,
  onToggle,
  showChange,
}: {
  run: AgentRun;
  open: boolean;
  onToggle: () => void;
  showChange?: boolean;
}) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span>
          <strong style={{ fontWeight: 500 }}>{LABELS[run.doctrineId] ?? run.doctrineId}</strong>
          {showChange && (
            <span style={{ fontSize: 12, color: run.verdictChangedFromPriorPhase ? "#a70" : "#999", marginLeft: 8 }}>
              {run.verdictChangedFromPriorPhase ? "revised" : "held position"}
            </span>
          )}
        </span>
        <span style={{ fontSize: 12, color: "#999" }}>{open ? "hide" : "show reasoning"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", fontSize: 13, lineHeight: 1.6 }}>
          <Stage label="Framing" text={run.framing} />
          <Stage label="Doctrinal analysis" text={run.doctrinalAnalysis} />
          <Stage
            label="Forecast"
            text={`Objective: ${run.forecast?.objective}\nProjected outcome: ${run.forecast?.projectedOutcome}\nConfidence: ${run.forecast?.confidence}`}
          />
          <Stage label="Verdict" text={run.verdict} />
          {run.changeJustification && <Stage label="Change justification" text={run.changeJustification} />}
        </div>
      )}
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
