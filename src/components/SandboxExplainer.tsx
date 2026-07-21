"use client";

import { agentColor, LABELS } from "@/src/lib/palette";
import { useLocale } from "@/src/i18n/LocaleContext";

// Agent order is locale-independent — only the per-agent blurb text (t.explainer.thinkers)
// comes from the dictionary. Keeping this list here (rather than in each dictionary) means
// there's one place that defines "which agents, in what order" instead of three.
const THINKER_IDS = [
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

export function SandboxExplainer() {
  const { t } = useLocale();
  const e = t.explainer;

  return (
    <section>
      <h1 className="page-title">{e.title}</h1>
      <p className="explainer-tagline">{e.tagline}</p>
      <p className="page-intro">{e.intro}</p>

      <p className="section-eyebrow" style={{ marginTop: "1.5rem" }}>
        {e.whyHeading}
      </p>
      <p className="case-brief" style={{ marginBottom: 10 }}>
        {e.whyIntro}
      </p>
      <ul className="thinker-list">
        {THINKER_IDS.map((id) => {
          const color = agentColor(id);
          return (
            <li key={id}>
              <span className="chip-dot" style={{ background: color.border }} />
              <span>
                <strong style={{ color: color.text }}>{LABELS[id]}</strong> — {e.thinkers[id]}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="section-eyebrow" style={{ marginTop: "1.75rem" }}>
        {e.howHeading}
      </p>
      <ol className="phase-list">
        {e.phases.map((p, i) => (
          <li key={p.name}>
            <span className="phase-number">{i + 1}</span>
            <span>
              <strong>{p.name}</strong> — {p.text}
            </span>
          </li>
        ))}
      </ol>

      <p className="case-brief" style={{ marginTop: "1.5rem" }}>
        <strong>{e.whatYouCanDoLabel}</strong> {e.whatYouCanDo}
      </p>

      <div className="disclaimer-box" style={{ marginTop: "1.25rem" }}>
        <p className="section-eyebrow disclaimer-box-eyebrow">{e.disclaimerLabel}</p>
        <p style={{ margin: 0 }}>{e.disclaimerBody}</p>
      </div>
    </section>
  );
}
