"use client";

import { agentColor } from "@/src/lib/palette";

// Toggle chip for the agent picker. Always shows the agent's identity dot (even when
// unselected) so the same color keeps meaning "this agent" everywhere it recurs — in the
// picker, in agent cards, and in the disagreement map.
export function AgentChip({
  id,
  label,
  active,
  onClick,
  disabled,
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const color = agentColor(id);
  return (
    <button
      type="button"
      className="chip"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1.5px solid ${active ? color.border : "#e3e3e0"}`,
        background: active ? color.bg : "#fff",
        color: active ? color.text : "#888",
      }}
    >
      <span className="chip-dot" style={{ background: color.border }} />
      {label}
    </button>
  );
}
