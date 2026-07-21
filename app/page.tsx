"use client";

import { useState } from "react";
import { AgentChip } from "@/src/components/AgentChip";
import { CaseResultTabs } from "@/src/components/CaseResultTabs";
import { SandboxExplainer } from "@/src/components/SandboxExplainer";
import { WlsFooter } from "@/src/components/WlsFooter";
import { LocaleSwitcher } from "@/src/components/LocaleSwitcher";
import { useLocale } from "@/src/i18n/LocaleContext";
import { ALL_AGENTS, LABELS } from "@/src/lib/palette";

const DEFAULT_ROSTER = [
  "spinoza", "weil", "solzhenitsyn", "ibnrushd", "gandhi", "boethius", "kropotkin", "gramsci", "diogenes",
];

interface PublicCase {
  id: string;
  title: string;
  brief: string;
  active_doctrines: string[];
}

const MAX_SUBMISSION_AGENTS = 6;

// Hardcoded, not fetched — no database-backed case list. Text reused from
// scripts/seed-cases.mjs's SEED_CASES. Clicking one only pre-fills the form fields below;
// it never creates or runs a case on its own. English-only regardless of UI locale — these
// are sample input data for the form, not interface copy.
const EXAMPLE_CASES: { title: string; brief: string }[] = [
  {
    title: "Municipal facial-recognition camera network",
    brief: `A city council is considering a proposal to install a networked facial-recognition
camera system across public transit hubs and major intersections, framed as a public-safety
and traffic-management measure. The system would be operated by the city's police department,
with data retained for 12 months. Proponents cite a projected 20% reduction in reported street
crime based on a pilot in another city. Opponents note the pilot's data collection methodology
was not independently audited, and that no legal framework currently governs who else may
access the footage, for how long, or under what oversight.`,
  },
  {
    title: "Universal basic income pilot, funded by a windfall tax",
    brief: `A regional government proposes a 3-year basic income pilot for 5,000 households,
funded by a new windfall tax on energy companies operating in the region. The stated objective
is to test effects on employment, health, and local spending. The energy companies argue the tax
will reduce investment in the region and could cost jobs elsewhere in their supply chain. The
pilot's outcome measures and success thresholds are being finalized concurrently with the
funding legislation, not before it.`,
  },
  {
    title: "Mandatory algorithmic transparency for public contract allocation",
    brief: `A proposed law would require any government body using automated or AI-assisted
systems to help decide public contract awards to publish the system's decision criteria and
underlying training data sources, and to grant independent auditors ongoing access to the
system's methodology. Government agencies argue this will slow procurement and expose
commercially sensitive vendor information. Transparency advocates argue that without this,
patterns of correlation between political support and contract allocation are undetectable by
outside parties.`,
  },
];

export default function SandboxPage() {
  const { locale, t } = useLocale();
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

  function useExample(example: { title: string; brief: string }) {
    setNewTitle(example.title);
    setNewBrief(example.brief);
  }

  // Shared by both the initial submission and later reruns with a different panel, so the
  // two paths always show identical phase-by-phase progress. Takes caseId/activeDoctrines
  // as parameters rather than reading selectedCase/roster from state, so it can be called
  // right after setSelectedCase() without waiting on a stale closure.
  async function runDeliberation(caseId: string, activeDoctrines: string[]) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setRunningPhase(1);
      const phase1Res = await fetch("/api/public/deliberate/phase1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, activeDoctrines, locale }),
      });
      const phase1Data = await phase1Res.json();
      if (!phase1Res.ok) throw new Error(phase1Data.error ?? t.page.errors.phase1Failed);

      setRunningPhase(2);
      const phase2Res = await fetch("/api/public/deliberate/phase2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, activeDoctrines, phase1: phase1Data.phase1, locale }),
      });
      const phase2Data = await phase2Res.json();
      if (!phase2Res.ok) throw new Error(phase2Data.error ?? t.page.errors.phase2Failed);

      setRunningPhase(3);
      const phase3Res = await fetch("/api/public/deliberate/phase3", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, phase2Final: phase2Data.phase2Final, locale }),
      });
      const phase3Data = await phase3Res.json();
      if (!phase3Res.ok) throw new Error(phase3Data.error ?? t.page.errors.phase3Failed);

      setResult({
        phase1: phase1Data.phase1,
        phase2Final: phase2Data.phase2Final,
        phase3: phase3Data.phase3,
      });
    } catch (err: any) {
      setError(err.message ?? t.page.errors.somethingWrong);
    } finally {
      setLoading(false);
      setRunningPhase(null);
    }
  }

  async function submitOwnCase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/submit-case", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          brief: newBrief,
          activeDoctrines: Array.from(newRoster),
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.page.errors.submissionFailed);
      setSelectedCase(data.case);
      setRoster(new Set(data.case.active_doctrines));
      await runDeliberation(data.case.id, data.case.active_doctrines);
    } catch (err: any) {
      setError(err.message ?? t.page.errors.somethingWrong);
      setLoading(false);
    }
  }

  function toggleAgent(id: string) {
    const next = new Set(roster);
    next.has(id) ? next.delete(id) : next.add(id);
    setRoster(next);
  }

  return (
    <div>
      <LocaleSwitcher />
      <SandboxExplainer />

      {!selectedCase && (
        <div>
          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: "1rem" }}>
            {t.page.liveNote.replace("{max}", String(MAX_SUBMISSION_AGENTS))}
          </p>

          <p className="section-eyebrow" style={{ marginTop: "1rem" }}>
            {t.page.tryAnExample}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
            {EXAMPLE_CASES.map((ex) => (
              <button key={ex.title} type="button" className="example-btn" onClick={() => useExample(ex)}>
                {ex.title}
              </button>
            ))}
          </div>

          <label className="field-label">{t.page.titleLabel}</label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-input"
            placeholder={t.page.titlePlaceholder}
            maxLength={140}
          />
          <label className="field-label">{t.page.briefLabel}</label>
          <textarea
            value={newBrief}
            onChange={(e) => setNewBrief(e.target.value)}
            rows={6}
            className="textarea-input"
            placeholder={t.page.briefPlaceholder}
            maxLength={4000}
          />
          <p className="field-label" style={{ margin: "1rem 0 6px" }}>
            {t.page.agentsLabel} ({newRoster.size}/{MAX_SUBMISSION_AGENTS})
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
            {loading ? t.page.runningDeliberation : t.page.submitAndRun}
          </button>
          {loading && runningPhase && <p className="status-text">{t.page.phaseStatus[runningPhase]}</p>}
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      {selectedCase && (
        <div style={{ marginTop: "1.5rem" }}>
          <button className="btn-ghost" onClick={() => setSelectedCase(null)} style={{ marginBottom: 12 }}>
            {t.page.submitAnotherCase}
          </button>
          <h2 className="case-title">{selectedCase.title}</h2>
          <p className="case-brief">{selectedCase.brief}</p>

          <p className="section-eyebrow" style={{ marginTop: "1.25rem" }}>
            {t.page.choosePanel}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1rem" }}>
            {ALL_AGENTS.map((id) => (
              <AgentChip key={id} id={id} label={LABELS[id]} active={roster.has(id)} onClick={() => toggleAgent(id)} />
            ))}
          </div>

          <button
            className="btn-primary"
            onClick={() => runDeliberation(selectedCase.id, Array.from(roster))}
            disabled={loading || roster.size === 0}
          >
            {loading ? t.page.runningLiveDeliberation : t.page.runDeliberation}
          </button>
          {loading && runningPhase && <p className="status-text">{t.page.phaseStatus[runningPhase]}</p>}
          <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 6 }}>{t.page.phase1Note}</p>

          {error && <p className="error-text">{error}</p>}

          {result && (
            <div style={{ marginTop: "1.5rem" }}>
              <CaseResultTabs
                phase1={result.phase1}
                phase2={result.phase2Final}
                phase3={result.phase3}
                phase2HintVariant="live"
              />
            </div>
          )}
        </div>
      )}

      <WlsFooter />
    </div>
  );
}
