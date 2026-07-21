// Best-effort classification of a verdict's stance from its wording — used only to decide
// whether to show an approve/reject symbol next to an agent's name. Deliberately
// conservative: checks only the verdict's first sentence (where the stance is usually
// stated plainly, before caveats/conditions), and returns null rather than guessing when
// both or neither keyword group appears, since a nuanced verdict misclassified as a hard
// approve/reject would be worse than showing no symbol at all.

export type VerdictStance = "approve" | "reject" | null;

const APPROVE_PATTERN =
  /\b(approve[sd]?|approving|support[s]?|supporting|endorse[sd]?|endorsing|accept[s]?|accepting|in favor|in favour)\b/;
const REJECT_PATTERN =
  /\b(reject(s|ed|ing)?|oppose[sd]?|opposing|deny|denies|denying|refuse[sd]?|refusing|against)\b/;

export function classifyVerdictStance(verdict: string): VerdictStance {
  if (!verdict) return null;
  const firstSentence = (verdict.trim().match(/^.*?[.!?](\s|$)/)?.[0] ?? verdict).toLowerCase();
  const hasApprove = APPROVE_PATTERN.test(firstSentence);
  const hasReject = REJECT_PATTERN.test(firstSentence);
  if (hasApprove && !hasReject) return "approve";
  if (hasReject && !hasApprove) return "reject";
  return null;
}
