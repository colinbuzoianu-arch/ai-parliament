// The aggregator is NOT one of the 9 doctrine agents. It has no doctrine of its own —
// its only job is to synthesize Phase 1 + Phase 2 outputs into a joint ruling with
// explicit majority position and attributed dissents. It never receives raw case facts
// directly; it only ever sees other agents' verdicts and reasoning.

import { callOpenAITool } from "@/src/lib/openaiClient";

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

export interface ReasoningTension {
  agentA: string;
  agentB: string;
  tension: string;
}

export interface JointRuling {
  method: "synthesis-with-dissent";
  majorityPosition: string;
  majoritySupport: string[]; // doctrine ids
  dissents: { doctrineId: string; position: string; reasoning: string }[];
  synthesisNotes: string;
  // Pairs of agents that land on the same conclusion (majority, or a shared dissent) but
  // arrive at it through explicitly different or conflicting reasoning.
  reasoningTensions: ReasoningTension[];
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
5. Flag any pair of agents that land on the same conclusion (majority, or a shared dissent)
   but arrive at it through explicitly different or conflicting reasoning. Populate
   reasoningTensions with these pairs directly — do not only describe them in prose.

Submit your ruling via the submit_ruling tool call.`;

// Structured output via tool-use (OpenAI function-calling): removes regex-parsing
// fragility and lets dissents be captured as real structured data instead of raw prose.
const SUBMIT_RULING_TOOL = {
  type: "function",
  function: {
    name: "submit_ruling",
    description: "Submit the joint ruling: majority position, supporting doctrines, and every dissent verbatim.",
    parameters: {
      type: "object",
      properties: {
        majorityPosition: {
          type: "string",
          description: "The majority position, or an empty string if the panel is evenly split or irreconcilable.",
        },
        majoritySupport: {
          type: "array",
          items: { type: "string" },
          description: "Doctrine ids supporting the majority position.",
        },
        dissents: {
          type: "array",
          items: {
            type: "object",
            properties: {
              doctrineId: { type: "string" },
              position: { type: "string" },
              reasoning: { type: "string" },
            },
            required: ["doctrineId", "position", "reasoning"],
          },
          description: "Every dissenting position, verbatim by doctrine - do not compress or paraphrase into the majority framing.",
        },
        synthesisNotes: {
          type: "string",
          description:
            "Notes on verdict changes between phases (argument-driven vs. pressure-driven), and an explicit " +
            "statement if the panel is evenly split or irreconcilable rather than a manufactured majority.",
        },
        reasoningTensions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              agentA: { type: "string", description: "Doctrine id of the first agent." },
              agentB: { type: "string", description: "Doctrine id of the second agent." },
              tension: {
                type: "string",
                description: "What conclusion they share, and how their reasoning paths to it explicitly conflict.",
              },
            },
            required: ["agentA", "agentB", "tension"],
          },
          description:
            "Pairs of doctrines that agree on the conclusion but explicitly disagree on the reasoning path. " +
            "Empty array if none.",
        },
      },
      required: ["majorityPosition", "majoritySupport", "dissents", "synthesisNotes", "reasoningTensions"],
    },
  },
} as const;

export async function aggregate(
  caseId: string,
  finalPositions: AgentRecord[]
): Promise<JointRuling> {
  const apiKey = process.env.OPENAI_API_KEY_AGGREGATOR || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY_AGGREGATOR");

  const userContent = `CASE ${caseId} — FINAL POSITIONS\n\n${finalPositions
    .map(
      (p) =>
        `[${p.doctrineId}] Verdict: ${p.verdict}\nReasoning: ${p.reasoning}\nChanged from prior phase: ${p.verdictChangedFromPriorPhase}${
          p.changeJustification ? `\nChange justification: ${p.changeJustification}` : ""
        }`
    )
    .join("\n\n")}`;

  const out = await callOpenAITool({
    apiKey,
    model: "gpt-4o",
    maxCompletionTokens: 3000,
    messages: [
      { role: "system", content: AGGREGATOR_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    tool: SUBMIT_RULING_TOOL,
    callerLabel: "Aggregator",
  });

  return parseAggregatorOutput(out);
}

function parseAggregatorOutput(out: any): JointRuling {
  return {
    method: "synthesis-with-dissent",
    majorityPosition: out.majorityPosition ?? "",
    majoritySupport: Array.isArray(out.majoritySupport) ? out.majoritySupport : [],
    dissents: Array.isArray(out.dissents) ? out.dissents : [],
    synthesisNotes: out.synthesisNotes ?? "",
    reasoningTensions: Array.isArray(out.reasoningTensions) ? out.reasoningTensions : [],
  };
}
