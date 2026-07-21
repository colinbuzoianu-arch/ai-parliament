"use client";

import { CaseResultTabs } from "@/src/components/CaseResultTabs";
import { WlsFooter } from "@/src/components/WlsFooter";
import { LocaleSwitcher } from "@/src/components/LocaleSwitcher";
import { useLocale } from "@/src/i18n/LocaleContext";
import type { AgentCardRun } from "@/src/components/AgentCard";
import type { DisagreementJointRuling } from "@/src/components/DisagreementMap";

interface JointRuling extends DisagreementJointRuling {
  synthesisNotes: string;
}

// Server component (app/case/[id]/page.tsx) fetches from Supabase and passes plain data down
// here — keeping all locale-dependent TEXT rendering in a client component means the
// LocaleSwitcher's change is reflected instantly (via context), with no page refresh needed
// to pick up a cookie change server-side.
export function PermalinkView({
  caseTitle,
  caseBrief,
  phase1,
  phase2,
  phase3,
}: {
  caseTitle: string;
  caseBrief: string;
  phase1: AgentCardRun[] | null;
  phase2?: AgentCardRun[];
  phase3?: JointRuling;
}) {
  const { t } = useLocale();

  if (!phase1) {
    return (
      <div>
        <LocaleSwitcher />
        <h1 className="case-title">{caseTitle}</h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>{t.permalink.noResults}</p>
        <WlsFooter />
      </div>
    );
  }

  return (
    <div>
      <LocaleSwitcher />
      <p style={{ marginBottom: 8 }}>
        <a href="/" className="back-link">
          {t.common.backToHome}
        </a>
      </p>
      <h1 className="case-title">{caseTitle}</h1>
      <p className="case-brief">{caseBrief}</p>

      <div style={{ marginTop: "1.75rem" }}>
        <CaseResultTabs phase1={phase1} phase2={phase2} phase3={phase3} phase2HintVariant="recorded" />
      </div>

      <WlsFooter />
    </div>
  );
}
