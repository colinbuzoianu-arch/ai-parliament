// AUTO-GENERATED scaffold for the "Ibn Rushd (Averroes)" agent.
import { systemPrompt, doctrineMeta } from "./config";

export interface Forecast {
  objective: string;
  projectedOutcome: string;
  confidence: "low" | "medium" | "high" | string;
}

export interface DeliberationInput {
  caseId: string;
  phase: 1 | 2 | 3;
  caseBrief: string;
  priorPositions?: { doctrineId: string; verdict: string; reasoning: string }[];
}

export interface DeliberationOutput {
  doctrineId: string;
  framing: string;
  doctrinalAnalysis: string;
  forecast: Forecast;
  verdict: string;
  /** Back-compat flat field some consumers (aggregator, logs) read as a single blob. */
  reasoning: string;
  verdictChangedFromPriorPhase: boolean;
  changeJustification?: string;
}

export async function deliberate(input: DeliberationInput): Promise<DeliberationOutput> {
  const apiKey = process.env[`ANTHROPIC_API_KEY_IBNRUSHD`] ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error(`Missing API key for agent "ibnrushd". Set ANTHROPIC_API_KEY_IBNRUSHD.`);

  const userContent = buildUserContent(input);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Agent "ibnrushd" API call failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content?.map((b: any) => b.text ?? "").join("\n") ?? "";
  return parseModelOutput(text);
}

function buildUserContent(input: DeliberationInput): string {
  let content = `CASE ${input.caseId} - PHASE ${input.phase}\n\n${input.caseBrief}`;
  if (input.priorPositions?.length) {
    content += "\n\nOTHER AGENTS' PRIOR POSITIONS:\n";
    for (const p of input.priorPositions) {
      content += `\n[${p.doctrineId}] Verdict: ${p.verdict}\nReasoning: ${p.reasoning}\n`;
    }
  }
  content +=
    "\n\nRespond with exactly these labeled sections: FRAMING:, DOCTRINAL_ANALYSIS:, " +
    "OBJECTIVE:, PROJECTED_OUTCOME:, CONFIDENCE:, VERDICT:, CHANGED: yes|no, WHY: (only if CHANGED is yes).";
  return content;
}

function parseModelOutput(text: string): DeliberationOutput {
  const get = (label: string) => {
    const re = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };
  const framing = get("FRAMING");
  const doctrinalAnalysis = get("DOCTRINAL_ANALYSIS");
  const forecast: Forecast = {
    objective: get("OBJECTIVE"),
    projectedOutcome: get("PROJECTED_OUTCOME"),
    confidence: (get("CONFIDENCE") || "medium").toLowerCase(),
  };
  const verdict = get("VERDICT") || text.slice(0, 280);

  return {
    doctrineId: doctrineMeta.id,
    framing,
    doctrinalAnalysis,
    forecast,
    verdict,
    reasoning: [framing, doctrinalAnalysis, `Forecast: ${forecast.projectedOutcome}`].filter(Boolean).join("\n\n"),
    verdictChangedFromPriorPhase: /^yes/i.test(get("CHANGED")),
    changeJustification: get("WHY") || undefined,
  };
}
