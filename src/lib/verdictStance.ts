// Best-effort classification of a verdict's stance from its wording — used only as a
// fallback for records written before agents produced a structured `stance` field directly
// (see generate_agents.py). Deliberately conservative: checks only the verdict's first
// sentence (where the stance is usually stated plainly, before caveats/conditions), handles
// simple negation ("should not be approved"), and returns null rather than guessing when the
// signal is unclear — a nuanced verdict misclassified as a hard approve/reject would be
// worse than showing no symbol at all.

export type VerdictStance = "approve" | "reject" | null;

// Deliberately no /g flag: these are module-level consts reused across every call, and a
// global regex's .test() is stateful (lastIndex persists between calls), which would make
// this function's result depend on call order. Non-global .test() is stateless and safe;
// .replace() without /g below just replaces the first match, which is fine for the short,
// single-sentence fragments this runs on.
const APPROVE_PATTERN =
  /\b(approve[sd]?|approving|support[s]?|supporting|endorse[sd]?|endorsing|accept[s]?|accepting|in favor|in favour)\b/;
const REJECT_PATTERN =
  /\b(reject(s|ed|ing)?|oppose[sd]?|opposing|deny|denies|denying|refuse[sd]?|refusing|against)\b/;

// "should not be approved", "not support", "cannot endorse" etc. read as the OPPOSITE of the
// plain keyword they contain — matched and stripped before the plain patterns run, so
// "not approved" doesn't also register as a plain "approve" hit.
const NEGATED_APPROVE_PATTERN =
  /\b(not|never|cannot|can't|won't|isn't|doesn't)\s+(be\s+)?(approve[sd]?|approving|support(ed|ing)?|endorse[sd]?|endorsing|accept(ed|ing)?)\b/;
const NEGATED_REJECT_PATTERN =
  /\b(not|never|cannot|can't|won't|isn't|doesn't)\s+(be\s+)?(reject(ed|ing)?|oppose[sd]?|opposing|den(y|ied|ying)|refuse[sd]?|refusing)\b/;

export function classifyVerdictStance(verdict: string): VerdictStance {
  if (!verdict) return null;
  const firstSentence = (verdict.trim().match(/^.*?[.!?](\s|$)/)?.[0] ?? verdict).toLowerCase();

  const negatedApprove = NEGATED_APPROVE_PATTERN.test(firstSentence); // "not approved" -> reject signal
  const negatedReject = NEGATED_REJECT_PATTERN.test(firstSentence); // "not rejected" -> approve signal

  const stripped = firstSentence.replace(NEGATED_APPROVE_PATTERN, "").replace(NEGATED_REJECT_PATTERN, "");
  const hasApprove = negatedReject || APPROVE_PATTERN.test(stripped);
  const hasReject = negatedApprove || REJECT_PATTERN.test(stripped);

  if (hasApprove && !hasReject) return "approve";
  if (hasReject && !hasApprove) return "reject";
  return null;
}
