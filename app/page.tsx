"use client";

import { useState } from "react";
import { AgentChip } from "@/src/components/AgentChip";
import { CaseResultTabs } from "@/src/components/CaseResultTabs";
import { SandboxExplainer } from "@/src/components/SandboxExplainer";
import { ALL_AGENTS, LABELS } from "@/src/lib/palette";

const DEFAULT_ROSTER = [
  "spinoza", "weil", "solzhenitsyn", "ibnrushd", "gandhi", "boethius", "kropotkin", "gramsci", "diogenes",
];

interface PublicCase {
  id: string;
  title: string;
  brief: string;
  active_doctrines: string[];
  source?: "seeded" | "user_submitted";
}

const MAX_SUBMISSION_AGENTS = 6;

const PHASE_STATUS: Record<1 | 2 | 3, string> = {
  1: "The agents are independently reviewing the case…",
  2: "Cross-examining each other's positions…",
  3: "Reaching a joint verdict…",
};

export default function SandboxPage() {
  const [selectedCase, setSelectedCase] = useState<PublicCase | null>(null);
  const [roster, setRoster] = useState<Set<string>>(new Set(DEFAULT_ROSTER));
  const [loading, setLoading] = useState(false);
  const [runningPhase, setRunningPhase] = useState<1 | 2 | 3 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");
  const [newRoster, setNewRoster] = useState<Set<string>>(new Set(["spinoza", "weil", "gramsci"]));

  function toggleNewRosterAgent(id: string) {
    const next = new Set(newRoster);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < MAX_SUBMISSION_AGENTS) {
      next.add(id);
    }
    setNewRoster(next);
  }

  async function submitOwnCase() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/public/submit-case", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          brief: newBrief,
          activeDoctrines: Array.from(newRoster),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setSelectedCase(data.case);
      setRoster(new Set(data.case.active_doctrines));
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggleAgent(id: string) {
    const next = new Set(roster);
    next.has(id) ? next.delete(id) : next.add(id);
    setRoster(next);
  }

  async function run() {
    if (!selectedCase) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const activeDoctrines = Array.from(roster);

      setRunningPhase(1);
      const phase1Res = await fetch("/api/public/deliberate/phase1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, activeDoctrines }),
      });
      const phase1Data = await phase1Res.json();
      if (!phase1Res.ok) throw new Error(phase1Data.error ?? "Phase 1 failed");

      setRunningPhase(2);
      const phase2Res = await fetch("/api/public/deliberate/phase2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, activeDoctrines, phase1: phase1Data.phase1 }),
      });
      const phase2Data = await phase2Res.json();
      if (!phase2Res.ok) throw new Error(phase2Data.error ?? "Phase 2 failed");

      setRunningPhase(3);
      const phase3Res = await fetch("/api/public/deliberate/phase3", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, phase2Final: phase2Data.phase2Final }),
      });
      const phase3Data = await phase3Res.json();
      if (!phase3Res.ok) throw new Error(phase3Data.error ?? "Phase 3 failed");

      setResult({
        phase1: phase1Data.phase1,
        phase2Final: phase2Data.phase2Final,
        phase3: phase3Data.phase3,
      });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setRunningPhase(null);
    }
  }

  return (
    <div>
      <SandboxExplainer />

      {!selectedCase && (
        <div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: "1rem" }}>
            This runs a live deliberation right now. To keep the sandbox affordable, pick up to{" "}
            {MAX_SUBMISSION_AGENTS} agents for a new case.
          </p>
          <label className="field-label">Title</label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-input"
            placeholder="e.g. Rezoning a floodplain for housing"
            maxLength={140}
          />
          <label className="field-label">Case brief</label>
          <textarea
            value={newBrief}
            onChange={(e) => setNewBrief(e.target.value)}
            rows={6}
            className="textarea-input"
            placeholder="Describe the policy or project the agents should deliberate on..."
            maxLength={4000}
          />
          <p className="field-label" style={{ margin: "1rem 0 6px" }}>
            Agents ({newRoster.size}/{MAX_SUBMISSION_AGENTS})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
            {ALL_AGENTS.map((id) => (
              <AgentChip
                key={id}
                id={id}
                label={LABELS[id]}
                active={newRoster.has(id)}
                onClick={() => toggleNewRosterAgent(id)}
                disabled={!newRoster.has(id) && newRoster.size >= MAX_SUBMISSION_AGENTS}
              />
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={submitOwnCase}
            disabled={loading || !newTitle.trim() || !newBrief.trim() || newRoster.size === 0}
          >
            {loading ? "Running deliberation..." : "Submit and run"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      {selectedCase && (
        <div style={{ marginTop: "1.5rem" }}>
          <button className="btn-ghost" onClick={() => setSelectedCase(null)} style={{ marginBottom: 12 }}>
            ← submit another case
          </button>
          <h2 className="case-title">{selectedCase.title}</h2>
          <p className="case-brief">{selectedCase.brief}</p>

          <p className="section-eyebrow" style={{ marginTop: "1.25rem" }}>
            Choose the panel
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
            {ALL_AGENTS.map((id) => (
              <AgentChip key={id} id={id} label={LABELS[id]} active={roster.has(id)} onClick={() => toggleAgent(id)} />
            ))}
          </div>

          {roster.size > 0 && (
            <p className="status-text" style={{ marginTop: 0, marginBottom: 8 }}>
              {roster.size} agent{roster.size === 1 ? "" : "s"} selected — this will make about{" "}
              {roster.size + 1} live API call{roster.size + 1 === 1 ? "" : "s"} (Phase 2 cross-examination
              + Phase 3 joint verdict; Phase 1 only adds calls for any agent not yet run on this case).
            </p>
          )}
          <button className="btn-primary" onClick={run} disabled={loading || roster.size === 0}>
            {loading ? "Running live deliberation..." : "Run deliberation"}
          </button>
          {loading && runningPhase && <p className="status-text">{PHASE_STATUS[runningPhase]}</p>}
          <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 6 }}>
            Independent reasoning (Phase 1) is precomputed for every agent on this case.
            Cross-examination and the joint ruling run live, for your chosen panel, right now.
          </p>

          {error && <p className="error-text">{error}</p>}

          {result && (
            <div style={{ marginTop: "1.5rem" }}>
              <CaseResultTabs
                phase1={result.phase1}
                phase2={result.phase2Final}
                phase3={result.phase3}
                phase2Hint="Final position after live cross-examination."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
