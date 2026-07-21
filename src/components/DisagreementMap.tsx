"use client";

import { PALETTE } from "@/src/lib/palette";

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
// (agents who share a distinct dissenting position) cycle through the rest. Sourced from
// the same shared palette used for per-agent identity elsewhere (chips, agent cards), so
// consensus grouping and agent identity read as one connected color system.
const GROUP_COLORS = PALETTE;

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
      <div style={{ overflowX: "auto", border: "1px solid #e4e4e1", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #e4e4e1" }}>
              <th className="stage-label" style={{ padding: "8px 10px" }}>
                Doctrine
              </th>
              <th className="stage-label" style={{ padding: "8px 10px" }}>
                Final verdict
              </th>
              <th className="stage-label" style={{ padding: "8px 10px" }}>
                Reasoning route
              </th>
            </tr>
          </thead>
          <tbody>
            {agentRuns.map((run) => {
              const g = groupOf.get(run.doctrineId);
              const color = g !== undefined ? GROUP_COLORS[g % GROUP_COLORS.length] : { bg: "transparent", border: "#ccc" };
              const hasTension = tensionAgents.has(run.doctrineId);
              return (
                <tr key={run.doctrineId} style={{ background: color.bg, borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 10px", borderLeft: `3px solid ${color.border}`, fontWeight: 600 }}>
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
                  <td style={{ padding: "8px 10px" }}>{truncate(run.verdict, 140)}</td>
                  <td style={{ padding: "8px 10px", color: "#666" }}>
                    {truncate(run.doctrinalAnalysis || run.framing, 110)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(jointRuling.reasoningTensions?.length ?? 0) > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#a3701f" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>⚠ Same conclusion, different reasoning:</p>
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
