"use client";

export interface DisagreementAgentRun {
  doctrineId: string;
  verdict: string;
  framing?: string;
  doctrinalAnalysis?: string;
}

export interface DisagreementJointRuling {
  majorityPosition: string;
  majoritySupport: string[];
  dissents: { doctrineId: string; position: string; reasoning: string }[];
  reasoningTensions?: { agentA: string; agentB: string; tension: string }[];
}

// One color per conclusion group: index 0 is reserved for the majority; dissent groups
// (agents who share a distinct dissenting position) cycle through the rest.
const GROUP_COLORS = [
  { bg: "#eef8f2", border: "#4a7" },
  { bg: "#fdf0d5", border: "#d9a441" },
  { bg: "#fde2e2", border: "#d97b7b" },
  { bg: "#e0f2fe", border: "#5b9bd5" },
  { bg: "#ede9fe", border: "#9b7bd5" },
  { bg: "#fce7f3", border: "#d57bb0" },
];

function truncate(text: string | undefined, maxLen: number): string {
  if (!text) return "";
  const trimmed = text.trim();
  const firstSentence = trimmed.match(/^.*?[.!?](\s|$)/);
  const candidate = firstSentence ? firstSentence[0].trim() : trimmed;
  if (candidate.length <= maxLen) return candidate;
  return candidate.slice(0, maxLen).trim() + "…";
}

export function DisagreementMap({
  agentRuns,
  jointRuling,
  labels,
}: {
  agentRuns: DisagreementAgentRun[];
  jointRuling: DisagreementJointRuling;
  labels: Record<string, string>;
}) {
  // Group agents by which conclusion they reached: the majority position is one group;
  // each distinct dissenting position (by exact text match) forms its own group.
  const groupOf = new Map<string, number>();
  let nextGroup = 0;

  if (jointRuling.majoritySupport?.length) {
    const g = nextGroup++;
    for (const id of jointRuling.majoritySupport) groupOf.set(id, g);
  }
  const dissentGroupByPosition = new Map<string, number>();
  for (const d of jointRuling.dissents ?? []) {
    const key = (d.position || "").trim().toLowerCase() || `_solo_${d.doctrineId}`;
    let g = dissentGroupByPosition.get(key);
    if (g === undefined) {
      g = nextGroup++;
      dissentGroupByPosition.set(key, g);
    }
    groupOf.set(d.doctrineId, g);
  }

  const tensionAgents = new Set<string>();
  const tensionsByAgent = new Map<string, string[]>();
  for (const t of jointRuling.reasoningTensions ?? []) {
    tensionAgents.add(t.agentA);
    tensionAgents.add(t.agentB);
    for (const id of [t.agentA, t.agentB]) {
      const arr = tensionsByAgent.get(id) ?? [];
      arr.push(`${labels[t.agentA] ?? t.agentA} ↔ ${labels[t.agentB] ?? t.agentB}: ${t.tension}`);
      tensionsByAgent.set(id, arr);
    }
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "6px 8px", fontWeight: 500, color: "#666" }}>Doctrine</th>
              <th style={{ padding: "6px 8px", fontWeight: 500, color: "#666" }}>Final verdict</th>
              <th style={{ padding: "6px 8px", fontWeight: 500, color: "#666" }}>Reasoning route</th>
            </tr>
          </thead>
          <tbody>
            {agentRuns.map((run) => {
              const g = groupOf.get(run.doctrineId);
              const color = g !== undefined ? GROUP_COLORS[g % GROUP_COLORS.length] : { bg: "transparent", border: "#ccc" };
              const hasTension = tensionAgents.has(run.doctrineId);
              return (
                <tr key={run.doctrineId} style={{ background: color.bg, borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "6px 8px", borderLeft: `3px solid ${color.border}` }}>
                    {labels[run.doctrineId] ?? run.doctrineId}
                    {hasTension && (
                      <span
                        title={tensionsByAgent.get(run.doctrineId)?.join(" | ")}
                        style={{ marginLeft: 6, color: "#c77", cursor: "help" }}
                      >
                        ⚠
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{truncate(run.verdict, 140)}</td>
                  <td style={{ padding: "6px 8px", color: "#555" }}>
                    {truncate(run.doctrinalAnalysis || run.framing, 110)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(jointRuling.reasoningTensions?.length ?? 0) > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#a70" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 500 }}>⚠ Same conclusion, different reasoning:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {jointRuling.reasoningTensions!.map((t, i) => (
              <li key={i}>
                {labels[t.agentA] ?? t.agentA} & {labels[t.agentB] ?? t.agentB}: {t.tension}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
