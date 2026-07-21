"use client";

import { useState } from "react";
import { AgentCard, type AgentCardRun } from "@/src/components/AgentCard";
import { DisagreementMap, type DisagreementJointRuling } from "@/src/components/DisagreementMap";
import { LABELS } from "@/src/lib/palette";
import { useLocale } from "@/src/i18n/LocaleContext";

interface JointRuling extends DisagreementJointRuling {
  synthesisNotes: string;
}

type TabKey = "phase1" | "phase2" | "phase3";

// Shared results view for a deliberation, used by both the root page (live runs) and the
// permalink page (read-only historical runs) so the two never drift into separate styles.
export function CaseResultTabs({
  phase1,
  phase2,
  phase3,
  phase2HintVariant,
}: {
  phase1: AgentCardRun[];
  phase2?: AgentCardRun[];
  phase3?: JointRuling;
  /** "live" for a just-run rerun (root page), "recorded" for a historical view (permalink).
   *  Text for each comes from the dictionary rather than being passed in as a raw string,
   *  so it translates along with everything else. */
  phase2HintVariant?: "live" | "recorded";
}) {
  const { t: dict } = useLocale();
  const tabs: { key: TabKey; label: string }[] = [
    { key: "phase1", label: dict.resultTabs.tabIndependent },
    ...(phase2?.length ? [{ key: "phase2" as const, label: dict.resultTabs.tabCrossExamination }] : []),
    ...(phase3 ? [{ key: "phase3" as const, label: dict.resultTabs.tabJointVerdict }] : []),
  ];
  const [active, setActive] = useState<TabKey>("phase1");

  const phase2Hint =
    phase2HintVariant === "live"
      ? dict.page.phase2HintRerun
      : phase2HintVariant === "recorded"
        ? dict.permalink.phase2Hint
        : undefined;

  return (
    <div>
      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${active === t.key ? "tab-btn--active" : ""}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="tab-hint">{dict.resultTabs.howToRead}</p>

      {active === "phase1" && (
        <div className="tab-panel" key="phase1-panel">
          {phase1.map((run) => (
            <AgentCard key={run.doctrineId} run={run} />
          ))}
        </div>
      )}

      {active === "phase2" && phase2 && (
        <div className="tab-panel" key="phase2-panel">
          {phase2Hint && <p className="tab-hint">{phase2Hint}</p>}
          {phase2.map((run) => (
            <AgentCard key={run.doctrineId + "-p2"} run={run} showChange />
          ))}
        </div>
      )}

      {active === "phase3" && phase3 && (
        <div className="tab-panel" key="phase3-panel">
          <div className="verdict-box">
            <p className="section-eyebrow">{dict.resultTabs.majorityPosition}</p>
            <p className="verdict-text">{phase3.majorityPosition}</p>
            {phase3.majoritySupport?.length > 0 && (
              <p className="verdict-support">
                {dict.resultTabs.supportedBy} {phase3.majoritySupport.map((id) => LABELS[id] ?? id).join(", ")}
              </p>
            )}
          </div>

          <p className="section-eyebrow" style={{ marginTop: "1.5rem" }}>
            {dict.resultTabs.disagreementMap}
          </p>
          <DisagreementMap agentRuns={phase2 ?? phase1} jointRuling={phase3} labels={LABELS} />

          <p className="section-eyebrow" style={{ marginTop: "1.5rem" }}>
            {dict.resultTabs.fullSynthesis}
          </p>
          <p className="case-brief" style={{ whiteSpace: "pre-wrap" }}>
            {phase3.synthesisNotes}
          </p>
        </div>
      )}
    </div>
  );
}
