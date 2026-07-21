// Two-stage gate against wasted API spend on non-cases (placeholder text, keyboard mash,
// unrelated content) — used by both the public submission endpoint and the admin case
// creation endpoint, so typing junk into either surface gets rejected the same way before
// any live agent calls happen. This is a substance check only — it never restricts which
// topics or positions the panel can address; the Stage 2 system prompt says so explicitly.

export const NOT_A_CASE_MESSAGE =
  "This doesn't look like a case description yet — add more detail about the decision or project you want the panel to deliberate on.";

// Stage 1: free, local checks that catch the cheapest junk (empty-ish, placeholder, or
// keyboard-mash submissions) without spending an API call.
function failsCheapChecks(brief: string): boolean {
  if (brief.length < 40) return true;
  if (/^(test|asdf|lorem ipsum|hello|hi|foo|bar)\W*$/i.test(brief)) return true;

  const counts = new Map<string, number>();
  for (const ch of brief) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const dominant = Math.max(...counts.values());
  if (dominant / brief.length > 0.6) return true;

  return false;
}

const CASE_GATE_SYSTEM_PROMPT = `You are a lightweight pre-check for a policy-deliberation sandbox. Your ONLY job is to
decide whether the submitted title and brief describe a decision, policy, or project that
is substantive enough for a panel of reasoning agents to deliberate on.

The submitted title and brief may be written in English, German, or French — the substance
check works exactly the same regardless of which of these three languages is used. Evaluate
the content, not the language it happens to be written in.

This is NOT a content, viewpoint, or political-neutrality check. Do not evaluate whether
the proposal is good, bad, offensive, one-sided, or controversial — say yes to anything
with real substance regardless of how contentious it is; debating exactly that kind of
material is the panel's job. Only say no to placeholder text, jokes, gibberish, or
submissions that don't actually describe any decision or proposal.

Respond with strict JSON only, no prose, no markdown fences:
{"isValidCase": boolean, "reason": string}
"reason" is one short sentence explaining the call either way.`;

// Stage 2: one cheap live call to catch submissions that pass the Stage 1 checks
// (long enough, not a keyboard mash) but still don't describe an actual decision or
// project — e.g. a paragraph of unrelated text or a description with no proposal in it.
async function isSubstantiveCase(title: string, brief: string): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: true }; // fail open — a missing key here shouldn't block submissions

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_completion_tokens: 150,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CASE_GATE_SYSTEM_PROMPT },
          { role: "user", content: `Title: ${title}\n\nBrief:\n${brief}` },
        ],
      }),
    });
    if (!res.ok) return { ok: true }; // fail open on infra errors — this is a spend guard, not a hard gate

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: true };

    const parsed = JSON.parse(content);
    if (typeof parsed.isValidCase !== "boolean") return { ok: true };
    return { ok: parsed.isValidCase, reason: typeof parsed.reason === "string" ? parsed.reason : undefined };
  } catch {
    return { ok: true }; // never let a gate-check hiccup block a legitimate submission
  }
}

// Runs both stages and returns a ready-to-use result for a route handler to act on.
export async function checkCaseSubstance(
  title: string,
  brief: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (failsCheapChecks(brief)) {
    return { ok: false, error: NOT_A_CASE_MESSAGE };
  }
  const gateResult = await isSubstantiveCase(title, brief);
  if (!gateResult.ok) {
    return { ok: false, error: gateResult.reason ?? NOT_A_CASE_MESSAGE };
  }
  return { ok: true };
}
