import { agentColor, LABELS } from "@/src/lib/palette";

// English-only for now (launch placeholder); Romanian and German are a fast-follow for the
// rest of the WLS site. Kept as a standalone component with the copy in plain data arrays
// below so a future i18n pass only has to swap these arrays/strings, not restructure markup.

const THINKERS: { id: string; blurb: string }[] = [
  { id: "spinoza", blurb: "reasons from causal necessity, not sentiment or tradition" },
  { id: "weil", blurb: "obligation before rights — names who bears the cost, not just who holds the claim" },
  { id: "solzhenitsyn", blurb: "refuses any policy that requires sacrificing or lying about who bears its cost" },
  { id: "ibnrushd", blurb: "demands a proposal survive rigorous, tradition-independent reasoning" },
  { id: "gandhi", blurb: "judges the process, not just the goal — a good outcome reached by coercion is a failure" },
  { id: "boethius", blurb: "separates what's owed to the powerful from what's actually right" },
  { id: "kropotkin", blurb: "asks whether a smaller, voluntary arrangement could work instead of centralizing power" },
  { id: "gramsci", blurb: 'asks whose interests get called "neutral" or "common sense"' },
  { id: "diogenes", blurb: "grants no proposal legitimacy just because it's authoritative or conventional" },
];

const PHASES: { name: string; text: string }[] = [
  {
    name: "Independent reasoning",
    text: "Each agent gets the case alone, with no knowledge of the others' positions, and produces four locked stages: framing, doctrinal analysis, a forecast (written and locked before the verdict), and the verdict itself.",
  },
  {
    name: "Cross-examination",
    text: "Agents see each other's positions and may revise — but must state plainly whether a change is driven by argument or by social pressure to converge.",
  },
  {
    name: "Joint verdict",
    text: "A separate synthesizer, with no doctrine of its own, produces a majority position and lists every dissent by name. Consensus is never forced.",
  },
];

export function SandboxExplainer() {
  return (
    <section>
      <h1 className="page-title">AI Parliament</h1>
      <p className="explainer-tagline">Nine reasoning traditions. Three phases. No forced consensus.</p>
      <p className="page-intro">
        This is an experimental deliberation engine built by World Legal Service. It isn't one
        AI giving you an answer — it's nine independent agents, each reasoning strictly from
        the doctrine of a historical thinker, working through a real policy question in three
        visible stages. Nothing is smoothed over: you see where they agree, where they don't,
        and why.
      </p>

      <p className="section-eyebrow" style={{ marginTop: "1.5rem" }}>
        Why these nine thinkers
      </p>
      <p className="case-brief" style={{ marginBottom: 10 }}>
        Each agent is bound to a thinker who reasoned from a position of real material cost —
        poverty, imprisonment, exile, or renunciation of income and comfort — for the sake of
        their thinking. That's not sentimentality; it's a filter against ideas shaped by what
        was convenient or profitable to argue.
      </p>
      <ul className="thinker-list">
        {THINKERS.map((t) => {
          const color = agentColor(t.id);
          return (
            <li key={t.id}>
              <span className="chip-dot" style={{ background: color.border }} />
              <span>
                <strong style={{ color: color.text }}>{LABELS[t.id]}</strong> — {t.blurb}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="section-eyebrow" style={{ marginTop: "1.75rem" }}>
        How a deliberation works
      </p>
      <ol className="phase-list">
        {PHASES.map((p, i) => (
          <li key={p.name}>
            <span className="phase-number">{i + 1}</span>
            <span>
              <strong>{p.name}</strong> — {p.text}
            </span>
          </li>
        ))}
      </ol>

      <p className="case-brief" style={{ marginTop: "1.5rem" }}>
        <strong>What you can do here:</strong> submit your own policy or project question and
        watch a live deliberation form.
      </p>

      <div className="disclaimer-box" style={{ marginTop: "1.25rem" }}>
        <p className="section-eyebrow disclaimer-box-eyebrow">What this isn't</p>
        <p style={{ margin: 0 }}>
          Legal or policy advice. This is an experimental research sandbox tied to WLS's work
          on AI governance and accountability. Verdicts are a language model reasoning as a
          historical position, not the thinkers' actual views, and not a substitute for
          institutional review. Submitted cases become public after a brief review — don't
          submit confidential information.
        </p>
      </div>
    </section>
  );
}
