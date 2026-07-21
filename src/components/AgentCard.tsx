"use client";

import { useState } from "react";
import { agentColor, LABELS } from "@/src/lib/palette";
import { classifyVerdictStance } from "@/src/lib/verdictStance";

export interface AgentCardRun {
  doctrineId: string;
  framing?: string;
  doctrinalAnalysis?: string;
  forecast?: { objective: string; projectedOutcome: string; confidence: string };
  verdict: string;
  verdictChangedFromPriorPhase?: boolean;
  changeJustification?: string;
}

// Collapsible card for a single agent's output in a given phase. Manages its own open
// state so the same component works whether the parent is a client page (sandbox) or a
// server component (the permalink page) rendering it as a child.
export function AgentCard({ run, showChange }: { run: AgentCardRun; showChange?: boolean }) {
  const [open, setOpen] = useState(false);
  const color = agentColor(run.doctrineId);
  const label = LABELS[run.doctrineId] ?? run.doctrineId;
  const stance = classifyVerdictStance(run.verdict);

  return (
    <div className="agent-card" style={{ borderLeftColor: color.border }}>
      <button type="button" className="agent-card-header" onClick={() => setOpen((o) => !o)}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className="agent-name" style={{ color: color.text }}>
            {label}
          </span>
          {stance && <StanceSymbol stance={stance} />}
          {showChange && (
            <span
              className={`status-pill ${
                run.verdictChangedFromPriorPhase ? "status-pill--revised" : "status-pill--held"
              }`}
            >
              {run.verdictChangedFromPriorPhase ? "revised" : "held"}
            </span>
          )}
        </span>
        <svg
          className={`chevron ${open ? "chevron--open" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
        >
          <path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="agent-card-body" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div style={{ overflow: "hidden" }}>
          <div className="agent-card-content">
            {run.framing && <Stage label="Framing" text={run.framing} />}
            {run.doctrinalAnalysis && <Stage label="Doctrinal analysis" text={run.doctrinalAnalysis} />}
            {run.forecast && (
              <Stage
                label="Forecast"
                text={`Objective: ${run.forecast.objective}\nProjected outcome: ${run.forecast.projectedOutcome}\nConfidence: ${run.forecast.confidence}`}
              />
            )}
            <Stage label="Verdict" text={run.verdict} />
            {run.changeJustification && <Stage label="Change justification" text={run.changeJustification} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Small colored symbol next to the agent's name showing the verdict's stance — separate
// from the agent's identity color (border/name), which stays fixed per agent everywhere
// else in the UI. Only rendered when classifyVerdictStance is confident (see that file).
function StanceSymbol({ stance }: { stance: "approve" | "reject" }) {
  const fill = stance === "approve" ? "#2f7a54" : "#a83e3e";
  const label = stance === "approve" ? "Approve" : "Reject";
  return (
    <span title={label} style={{ display: "inline-flex", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" role="img" aria-label={label}>
        <circle cx="7" cy="7" r="7" fill={fill} />
        {stance === "approve" ? (
          <path
            d="M4 7.2L6.2 9.4L10 5"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : (
          <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        )}
      </svg>
    </span>
  );
}

function Stage({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div className="stage">
      <p className="stage-label">{label}</p>
      <p className="stage-text">{text}</p>
    </div>
  );
}
