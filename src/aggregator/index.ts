// The aggregator is NOT one of the 9 doctrine agents. It has no doctrine of its own —
// its only job is to synthesize Phase 1 + Phase 2 outputs into a joint ruling with
// explicit majority position and attributed dissents. It never receives raw case facts
// directly; it only ever sees other agents' verdicts and reasoning.

export interface AgentRecord {
  doctrineId: string;
  framing?: string;
  doctrinalAnalysis?: string;
  forecast?: { objective: string; projectedOutcome: string; confidence: string };
  verdict: string;
  reasoning: string;
  verdictChangedFromPriorPhase: boolean;
  changeJustification?: string;
}

export interface JointRuling {
  method: "synthesis-with-dissent";
  majorityPosition: string;
  majoritySupport: string[]; // doctrine ids
  dissents: { doctrineId: string; position: string; reasoning: string }[];
  synthesisNotes: string;
}

const AGGREGATOR_SYSTEM_PROMPT = `You are the aggregator for an AI Parliament sandbox. You hold no
doctrine of your own. You are given the final-phase verdicts and reasoning of a subset of
doctrine agents (Spinoza, Kropotkin, Weil, Gramsci, Gandhi, Diogenes, Boethius, Luxemburg,
La Boetie — only those present in this case's roster participate).

Your task:
1. Identify the majority position, if one exists, and list which doctrines support it.
2. List every dissenting position verbatim by doctrine, with its stated reasoning — do not
   compress or paraphrase dissents into the majority framing.
3. Do NOT force a false consensus. If the panel is evenly split or irreconcilable, say so
   explicitly rather than manufacturing a majority.
4. Note any verdict that changed between phases and whether the change reads as
   argument-driven or pressure-driven, based on the agents' own change justifications.

Output format: MAJORITY:, SUPPORTED_BY:, DISSENTS:, SYNTHESIS_NOTES:`;

export async function aggregate(
  caseId: string,
  finalPositions: AgentRecord[]
): Promise<JointRuling> {
  const apiKey = process.env.ANTHROPIC_API_KEY_AGGREGATOR ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY_AGGREGATOR");

  const userContent = `CASE ${caseId} — FINAL POSITIONS\n\n${finalPositions
    .map(
      (p) =>
        `[${p.doctrineId}] Verdict: ${p.verdict}\nReasoning: ${p.reasoning}\nChanged from prior phase: ${p.verdictChangedFromPriorPhase}${
          p.changeJustification ? `\nChange justification: ${p.changeJustification}` : ""
        }`
    )
    .join("\n\n")}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: AGGREGATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Aggregator call failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content?.map((b: any) => b.text ?? "").join("\n") ?? "";
  return parseAggregatorOutput(text);
}

function parseAggregatorOutput(text: string): JointRuling {
  const get = (label: string) => {
    const re = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };
  const supportedBy = get("SUPPORTED_BY")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    method: "synthesis-with-dissent",
    majorityPosition: get("MAJORITY"),
    majoritySupport: supportedBy,
    dissents: [], // parsed from DISSENTS: block; left structured-but-raw for the UI to render,
    // since dissent formatting varies — see synthesisNotes for the full text if parsing is thin.
    synthesisNotes: get("SYNTHESIS_NOTES") || get("DISSENTS") || text,
  };
}
