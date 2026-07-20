"use client";

import { useEffect, useState } from "react";

const ALL_AGENTS = [
  "spinoza", "weil", "solzhenitsyn", "ibnrushd", "gandhi",
  "boethius", "kropotkin", "gramsci", "diogenes", "luxemburg", "laboetie",
];
const DEFAULT_ROSTER = [
  "spinoza", "weil", "solzhenitsyn", "ibnrushd", "gandhi", "boethius", "kropotkin", "gramsci", "diogenes",
];
const LABELS: Record<string, string> = {
  spinoza: "Spinoza", weil: "Weil", solzhenitsyn: "Solzhenitsyn", ibnrushd: "Ibn Rushd",
  gandhi: "Gandhi", boethius: "Boethius", kropotkin: "Kropotkin", gramsci: "Gramsci",
  diogenes: "Diogenes", luxemburg: "Luxemburg", laboetie: "La Boetie",
};

interface PublicCase {
  id: string;
  title: string;
  brief: string;
  active_doctrines: string[];
  source?: "seeded" | "user_submitted";
}

const MAX_SUBMISSION_AGENTS = 6;

export default function SandboxPage() {
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PublicCase | null>(null);
  const [roster, setRoster] = useState<Set<string>>(new Set(DEFAULT_ROSTER));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"gallery" | "submit">("gallery");
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");
  const [newRoster, setNewRoster] = useState<Set<string>>(new Set(["spinoza", "weil", "gramsci"]));

  useEffect(() => {
    loadCases();
  }, []);

  function loadCases() {
    fetch("/api/public/cases")
      .then((r) => r.json())
      .then(setCases)
      .catch(() => setError("Could not load the case gallery."));
  }

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
      setMode("gallery");
      loadCases();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function pickCase(c: PublicCase) {
    setSelectedCase(c);
    setResult(null);
    setError(null);
    setRoster(new Set(DEFAULT_ROSTER));
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
      const res = await fetch("/api/public/deliberate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: selectedCase.id, activeDoctrines: Array.from(roster) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deliberation failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(id: string) {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>AI Parliament — sandbox</h1>
      <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
        Nine (or more) agents, each reasoning strictly from the doctrine of a thinker who wrote
        from poverty or renounced material gain for their work, deliberate on a policy case in
        three phases: independent reasoning, cross-examination, and a joint ruling with
        attributed dissent. Pick a case, choose which agents sit on the panel, and run a live
        deliberation.
      </p>

      {!selectedCase && (
        <div style={{ display: "flex", gap: 8, margin: "1rem 0", borderBottom: "1px solid #ddd", paddingBottom: 8 }}>
          <button
            onClick={() => setMode("gallery")}
            style={{ fontSize: 13, fontWeight: mode === "gallery" ? 500 : 400, background: "none", border: "none", cursor: "pointer" }}
          >
            Browse cases
          </button>
          <button
            onClick={() => setMode("submit")}
            style={{ fontSize: 13, fontWeight: mode === "submit" ? 500 : 400, background: "none", border: "none", cursor: "pointer" }}
          >
            Submit your own
          </button>
        </div>
      )}

      {!selectedCase && mode === "gallery" && (
        <div style={{ display: "grid", gap: 12 }}>
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => pickCase(c)}
              style={{
                textAlign: "left",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: 8,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <p style={{ fontWeight: 500, margin: "0 0 4px" }}>
                {c.title}
                {c.source === "user_submitted" && (
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#4a7", marginLeft: 8 }}>
                    submitted by a visitor
                  </span>
                )}
              </p>
              <p style={{ fontSize: 13, color: "#666", margin: 0 }}>{c.brief.slice(0, 140)}...</p>
            </button>
          ))}
        </div>
      )}

      {!selectedCase && mode === "submit" && (
        <div>
          <p style={{ fontSize: 13, color: "#666" }}>
            Submissions become part of the public gallery — anyone can view the result afterward.
            To keep the sandbox affordable, pick up to {MAX_SUBMISSION_AGENTS} agents for a new case.
          </p>
          <label style={{ display: "block", margin: "1rem 0 4px", fontSize: 13, color: "#666" }}>Title</label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ width: "100%", padding: 8, fontSize: 14 }}
            placeholder="e.g. Rezoning a floodplain for housing"
            maxLength={140}
          />
          <label style={{ display: "block", margin: "1rem 0 4px", fontSize: 13, color: "#666" }}>
            Case brief
          </label>
          <textarea
            value={newBrief}
            onChange={(e) => setNewBrief(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 8, fontSize: 14 }}
            placeholder="Describe the policy or project the agents should deliberate on..."
            maxLength={4000}
          />
          <p style={{ fontSize: 13, color: "#666", margin: "1rem 0 6px" }}>
            Agents ({newRoster.size}/{MAX_SUBMISSION_AGENTS})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
            {ALL_AGENTS.map((id) => (
              <button
                key={id}
                onClick={() => toggleNewRosterAgent(id)}
                style={{
                  fontSize: 12,
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: newRoster.has(id) ? "1px solid #4a7" : "1px solid #ccc",
                  background: newRoster.has(id) ? "#eef8f2" : "transparent",
                  cursor: "pointer",
                }}
              >
                {LABELS[id]}
              </button>
            ))}
          </div>
          <button
            onClick={submitOwnCase}
            disabled={loading || !newTitle.trim() || !newBrief.trim() || newRoster.size === 0}
            style={{ padding: "8px 16px", fontSize: 14, cursor: "pointer" }}
          >
            {loading ? "Running deliberation..." : "Submit and run"}
          </button>
          {error && <p style={{ color: "#a33", marginTop: "1rem" }}>{error}</p>}
        </div>
      )}

      {selectedCase && (
        <div style={{ marginTop: "1.5rem" }}>
          <button
            onClick={() => setSelectedCase(null)}
            style={{ fontSize: 13, marginBottom: 12, background: "none", border: "none", cursor: "pointer", color: "#666" }}
          >
            ← back to cases
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 500 }}>{selectedCase.title}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#333" }}>{selectedCase.brief}</p>

          <p style={{ fontSize: 13, color: "#666", margin: "1rem 0 6px" }}>Choose the panel</p>
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
              </button>
            ))}
          </div>

          <button
            onClick={run}
            disabled={loading || roster.size === 0}
            style={{ padding: "8px 16px", fontSize: 14, cursor: "pointer" }}
          >
            {loading ? "Running live deliberation..." : "Run deliberation"}
          </button>
          <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
            Independent reasoning (Phase 1) is precomputed for every agent on this case.
            Cross-examination and the joint ruling run live, for your chosen panel, right now.
          </p>

          {error && <p style={{ color: "#a33", marginTop: "1rem" }}>{error}</p>}

          {result && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: 16, fontWeight: 500 }}>Phase 1 — independent reasoning</h3>
              {result.phase1.map((run: any) => (
                <AgentCard
                  key={run.doctrineId}
                  run={run}
                  open={expanded.has(run.doctrineId)}
                  onToggle={() => toggleExpanded(run.doctrineId)}
                />
              ))}

              <h3 style={{ fontSize: 16, fontWeight: 500, marginTop: "1.5rem" }}>
                Phase 2 — after cross-examination (live)
              </h3>
              {result.phase2Final.map((run: any) => (
                <AgentCard
                  key={run.doctrineId + "-p2"}
                  run={run}
                  open={expanded.has(run.doctrineId + "-p2")}
                  onToggle={() => toggleExpanded(run.doctrineId + "-p2")}
                  showChange
                />
              ))}

              <h3 style={{ fontSize: 16, fontWeight: 500, marginTop: "1.5rem" }}>Phase 3 — joint ruling (live)</h3>
              <div style={{ background: "#f7f7f5", borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px" }}>Majority position</p>
                <p style={{ fontSize: 14, margin: 0 }}>{result.phase3.majorityPosition}</p>
              </div>
              <p style={{ fontSize: 13, whiteSpace: "pre-wrap", marginTop: 10 }}>{result.phase3.synthesisNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentCard({ run, open, onToggle, showChange }: { run: any; open: boolean; onToggle: () => void; showChange?: boolean }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", padding: "10px 14px", display: "flex",
          justifyContent: "space-between", alignItems: "center", background: "transparent",
          border: "none", cursor: "pointer",
        }}
      >
        <span>
          <strong style={{ fontWeight: 500 }}>{LABELS[run.doctrineId] ?? run.doctrineId}</strong>
          {showChange && (
            <span style={{ fontSize: 12, color: run.verdictChangedFromPriorPhase ? "#a70" : "#999", marginLeft: 8 }}>
              {run.verdictChangedFromPriorPhase ? "revised position" : "held position"}
            </span>
          )}
        </span>
        <span style={{ fontSize: 12, color: "#999" }}>{open ? "hide" : "show reasoning"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px", fontSize: 13, lineHeight: 1.6 }}>
          {run.framing && <Stage label="Framing" text={run.framing} />}
          {run.doctrinalAnalysis && <Stage label="Doctrinal analysis" text={run.doctrinalAnalysis} />}
          {run.forecast && (
            <Stage
              label="Forecast"
              text={`Objective: ${run.forecast.objective}\nProjected outcome: ${run.forecast.projectedOutcome}\nConfidence: ${run.forecast.confidence}`}
            />
          )}
          <Stage label="Verdict" text={run.verdict} />
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
