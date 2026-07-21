// Canonical dictionary shape — de.ts and fr.ts are typed against `Dictionary` (derived from
// this file via `typeof en`), so a missing or extra key in either is a compile error rather
// than a silent fallback to English at runtime.

export const en = {
  common: {
    backToHome: "← back to AI Parliament",
  },
  explainer: {
    title: "AI Parliament",
    tagline: "Nine reasoning traditions. Three phases. No forced consensus.",
    intro:
      "This is an experimental deliberation engine built by World Legal Service. It isn't one " +
      "AI giving you an answer — it's nine independent agents, each reasoning strictly from " +
      "the doctrine of a historical thinker, working through a real policy question in three " +
      "visible stages. Nothing is smoothed over: you see where they agree, where they don't, " +
      "and why.",
    whyHeading: "Why these nine thinkers",
    whyIntro:
      "Each agent is bound to a thinker who reasoned from a position of real material cost — " +
      "poverty, imprisonment, exile, or renunciation of income and comfort — for the sake of " +
      "their thinking. That's not sentimentality; it's a filter against ideas shaped by what " +
      "was convenient or profitable to argue.",
    thinkers: {
      spinoza: "reasons from causal necessity, not sentiment or tradition",
      weil: "obligation before rights — names who bears the cost, not just who holds the claim",
      solzhenitsyn: "refuses any policy that requires sacrificing or lying about who bears its cost",
      ibnrushd: "demands a proposal survive rigorous, tradition-independent reasoning",
      gandhi: "judges the process, not just the goal — a good outcome reached by coercion is a failure",
      boethius: "separates what's owed to the powerful from what's actually right",
      kropotkin: "asks whether a smaller, voluntary arrangement could work instead of centralizing power",
      gramsci: 'asks whose interests get called "neutral" or "common sense"',
      diogenes: "grants no proposal legitimacy just because it's authoritative or conventional",
    },
    howHeading: "How a deliberation works",
    phases: [
      {
        name: "Independent reasoning",
        text:
          "Each agent gets the case alone, with no knowledge of the others' positions, and " +
          "produces four locked stages: framing, doctrinal analysis, a forecast (written and " +
          "locked before the verdict), and the verdict itself.",
      },
      {
        name: "Cross-examination",
        text:
          "Agents see each other's positions and may revise — but must state plainly whether a " +
          "change is driven by argument or by social pressure to converge.",
      },
      {
        name: "Joint verdict",
        text:
          "A separate synthesizer, with no doctrine of its own, produces a majority position " +
          "and lists every dissent by name. Consensus is never forced.",
      },
    ],
    whatYouCanDoLabel: "What you can do here:",
    whatYouCanDo:
      "browse example cases, or submit your own policy or project question and watch a live " +
      "deliberation form.",
    disclaimerLabel: "What this isn't",
    disclaimerBody:
      "Legal or policy advice. This is an experimental research sandbox tied to WLS's work on " +
      "AI governance and accountability. Verdicts are a language model reasoning as a " +
      "historical position, not the thinkers' actual views, and not a substitute for " +
      "institutional review. Submitted cases aren't published or listed anywhere public, but " +
      "this is a research sandbox, not secure storage — don't submit confidential information.",
  },
  footer: {
    initiative: "An initiative of World Legal Service",
  },
  resultTabs: {
    tabIndependent: "Independent reasoning",
    tabCrossExamination: "Cross-examination",
    tabJointVerdict: "Joint verdict",
    howToRead:
      "How to read this: Phase 1 is fully independent — each agent reasons alone, with no " +
      "visibility into the others. Phase 2 and Phase 3 are live for whichever agents were " +
      "selected for this run.",
    majorityPosition: "Majority position",
    supportedBy: "Supported by:",
    disagreementMap: "Disagreement map",
    fullSynthesis: "Full synthesis / dissents",
  },
  disagreementMap: {
    doctrine: "Doctrine",
    finalVerdict: "Final verdict",
    reasoningRoute: "Reasoning route",
    sameConclusion: "⚠ Same conclusion, different reasoning:",
  },
  agentCard: {
    framing: "Framing",
    doctrinalAnalysis: "Doctrinal analysis",
    forecast: "Forecast",
    verdict: "Verdict",
    changeJustification: "Change justification",
    objective: "Objective",
    projectedOutcome: "Projected outcome",
    confidence: "Confidence",
    revised: "revised",
    held: "held",
    approve: "Approve",
    reject: "Reject",
  },
  page: {
    liveNote: "This runs a live deliberation right now. To keep the sandbox affordable, pick up to {max} agents for a new case.",
    tryAnExample: "Try an example",
    titleLabel: "Title",
    titlePlaceholder: "e.g. Rezoning a floodplain for housing",
    briefLabel: "Case brief",
    briefPlaceholder: "Describe the policy or project the agents should deliberate on...",
    agentsLabel: "Agents",
    submitAndRun: "Submit and run",
    runningDeliberation: "Running deliberation...",
    submitAnotherCase: "← submit another case",
    choosePanel: "Choose the panel",
    runDeliberation: "Run deliberation",
    runningLiveDeliberation: "Running live deliberation...",
    phase1Note:
      "Independent reasoning (Phase 1) is precomputed for every agent on this case. " +
      "Cross-examination and the joint ruling run live, for your chosen panel, right now.",
    phaseStatus: {
      1: "The agents are independently reviewing the case…",
      2: "Cross-examining each other's positions…",
      3: "Reaching a joint verdict…",
    },
    phase2HintRerun: "Final position after live cross-examination.",
    errors: {
      phase1Failed: "Phase 1 failed",
      phase2Failed: "Phase 2 failed",
      phase3Failed: "Phase 3 failed",
      submissionFailed: "Submission failed",
      somethingWrong: "Something went wrong",
    },
  },
  permalink: {
    noResults: "This case hasn't been deliberated yet — no results to show.",
    phase2Hint: "Final recorded position after cross-examination.",
  },
};

export type Dictionary = typeof en;
