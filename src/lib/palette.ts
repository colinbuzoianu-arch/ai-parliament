// Single source of visual identity for the public sandbox and its permalink page.
// The first six entries are exactly DisagreementMap's original GROUP_COLORS (consensus
// grouping — index 0 is always the majority, the rest cycle for dissent groups); the
// remaining five extend the same bg/border/text hue family so a per-agent identity color
// (used in chips and agent cards) reads as one connected palette, not two systems.

export interface PaletteColor {
  bg: string;
  border: string;
  text: string;
}

export const PALETTE: PaletteColor[] = [
  { bg: "#eef8f2", border: "#4a9c74", text: "#2f7a54" }, // green
  { bg: "#fdf0d5", border: "#c98a2a", text: "#8a6118" }, // amber
  { bg: "#fde2e2", border: "#c85f5f", text: "#a83e3e" }, // red
  { bg: "#e0f2fe", border: "#3f83b8", text: "#2a6ca8" }, // blue
  { bg: "#ede9fe", border: "#8058c2", text: "#6b46b8" }, // purple
  { bg: "#fce7f3", border: "#bd5a94", text: "#a83e79" }, // pink
  { bg: "#e0f7f5", border: "#328f87", text: "#256b65" }, // teal
  { bg: "#fdebe0", border: "#c2652f", text: "#a3521f" }, // orange
  { bg: "#eef1f5", border: "#66748c", text: "#4f5c70" }, // slate
  { bg: "#fbe4ea", border: "#a83f5c", text: "#8a2f49" }, // crimson
  { bg: "#eceafd", border: "#5b64c2", text: "#4249a8" }, // indigo
];

// Canonical agent order — fixes which palette entry belongs to which doctrine, independent
// of any particular case's roster order.
const AGENT_ORDER = [
  "spinoza",
  "kropotkin",
  "weil",
  "solzhenitsyn",
  "ibnrushd",
  "gandhi",
  "boethius",
  "gramsci",
  "diogenes",
  "luxemburg",
  "laboetie",
] as const;

export const AGENT_COLORS: Record<string, PaletteColor> = Object.fromEntries(
  AGENT_ORDER.map((id, i) => [id, PALETTE[i % PALETTE.length]])
);

const FALLBACK_COLOR: PaletteColor = { bg: "#f2f2f0", border: "#aaa", text: "#666" };

export function agentColor(doctrineId: string): PaletteColor {
  return AGENT_COLORS[doctrineId] ?? FALLBACK_COLOR;
}

export const LABELS: Record<string, string> = {
  spinoza: "Spinoza",
  weil: "Weil",
  solzhenitsyn: "Solzhenitsyn",
  ibnrushd: "Ibn Rushd",
  gandhi: "Gandhi",
  boethius: "Boethius",
  kropotkin: "Kropotkin",
  gramsci: "Gramsci",
  diogenes: "Diogenes",
  luxemburg: "Luxemburg",
  laboetie: "La Boetie",
};

export const ALL_AGENTS: string[] = [...AGENT_ORDER];
