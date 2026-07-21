// AUTO-GENERATED scaffold for the "Antonio Gramsci" agent.
import { systemPrompt, doctrineMeta } from "./config";
import { callOpenAITool } from "@/src/lib/openaiClient";

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
  /** One self-contained sentence: verdict + core reason. This is what other agents see of
   *  this position in Phase 2 — cheaper than the full reasoning and, since the model writes
   *  it knowing that's its job, more targeted than a truncated excerpt would be. */
  headline: string;
  /** The bottom-line recommendation, stated directly by the model rather than inferred by
   *  regex from verdict text — free-text verdicts are phrased too variably (and can include
   *  negation, e.g. "should not be approved") for keyword-matching to be reliable. */
  stance: "approve" | "reject" | "mixed";
  framing: string;
  doctrinalAnalysis: string;
  forecast: Forecast;
  verdict: string;
  /** Back-compat flat field some consumers (aggregator, logs) read as a single blob. */
  reasoning: string;
  verdictChangedFromPriorPhase: boolean;
  changeJustification?: string;
}

// Structured output via tool-use (OpenAI function-calling): the model must call this
// function instead of producing free text with labeled sections. Removes regex-parsing
// fragility entirely.
const SUBMIT_DELIBERATION_TOOL = {
  type: "function",
  function: {
    name: "submit_deliberation",
    description:
      "Submit your four-stage deliberation for this case: framing, doctrinal analysis, forecast, and verdict.",
    parameters: {
      type: "object",
      properties: {
        headline: {
          type: "string",
          description:
            "One self-contained sentence stating your verdict and its core reason. Other agents " +
            "will see ONLY this (not your full framing/analysis) when cross-examining in Phase 2, " +
            "so it must stand alone as a fair summary of your position.",
        },
        stance: {
          type: "string",
          enum: ["approve", "reject", "mixed"],
          description:
            "Your bottom-line recommendation, independent of any conditions attached to it: approve " +
            "if you favor proceeding, even conditionally (an approval with an audit clause attached " +
            "is still approve, not mixed); reject if you favor not proceeding; mixed ONLY if you are " +
            "genuinely undecided or exactly split, not merely conditional.",
        },
        framing: {
          type: "string",
          description: "What this doctrine is actually being asked to evaluate in this case.",
        },
        doctrinalAnalysis: {
          type: "string",
          description: "The doctrine applied to the specific facts of the case.",
        },
        forecast: {
          type: "object",
          description: "Written before the verdict and never revised after - the pre-commitment record.",
          properties: {
            objective: { type: "string", description: "The outcome standard the proposal is judged against." },
            projectedOutcome: { type: "string", description: "What you expect to happen if the proposal proceeds." },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["objective", "projectedOutcome", "confidence"],
        },
        verdict: {
          type: "string",
          description: "Your actual position, which must follow from framing, doctrinal analysis, and forecast.",
        },
        changed: {
          type: "boolean",
          description: "True only in Phase 2+ if this verdict changed from your own prior-phase position.",
        },
        why: {
          type: "string",
          description:
            "Required if changed is true: state explicitly whether the doctrine itself justifies the update, " +
            "versus social pressure to converge. Label a pressure-driven change as such.",
        },
      },
      required: ["headline", "stance", "framing", "doctrinalAnalysis", "forecast", "verdict", "changed"],
    },
  },
} as const;

export async function deliberate(input: DeliberationInput): Promise<DeliberationOutput> {
  const apiKey = process.env[`OPENAI_API_KEY_GRAMSCI`] || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error(`Missing API key for agent "gramsci". Set OPENAI_API_KEY_GRAMSCI.`);

  const userContent = buildUserContent(input);

  const out = await callOpenAITool({
    apiKey,
    model: "gpt-4o-mini",
    maxCompletionTokens: 2500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    tool: SUBMIT_DELIBERATION_TOOL,
    callerLabel: `Agent "gramsci"`,
  });

  return parseModelOutput(out);
}

function buildUserContent(input: DeliberationInput): string {
  let content = `CASE ${input.caseId} - PHASE ${input.phase}\n\n${input.caseBrief}`;
  if (input.priorPositions?.length) {
    content += "\n\nOTHER AGENTS' PRIOR POSITIONS:\n";
    for (const p of input.priorPositions) {
      content += `\n[${p.doctrineId}] Verdict: ${p.verdict}\nReasoning: ${p.reasoning}\n`;
    }
  }
  return content;
}

function parseModelOutput(out: any): DeliberationOutput {
  const forecast: Forecast = {
    objective: out.forecast?.objective ?? "",
    projectedOutcome: out.forecast?.projectedOutcome ?? "",
    confidence: out.forecast?.confidence ?? "medium",
  };

  const stance = out.stance === "approve" || out.stance === "reject" || out.stance === "mixed" ? out.stance : "mixed";

  return {
    doctrineId: doctrineMeta.id,
    headline: out.headline ?? "",
    stance,
    framing: out.framing ?? "",
    doctrinalAnalysis: out.doctrinalAnalysis ?? "",
    forecast,
    verdict: out.verdict ?? "",
    reasoning: [out.framing, out.doctrinalAnalysis, `Forecast: ${forecast.projectedOutcome}`]
      .filter(Boolean)
      .join("\n\n"),
    verdictChangedFromPriorPhase: !!out.changed,
    changeJustification: out.why || undefined,
  };
}
