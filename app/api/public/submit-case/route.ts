import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { checkCaseSubstance } from "@/src/lib/caseGate";
import { checkAndIncrementDailyUsage, ALL_DOCTRINE_IDS, type DoctrineId } from "@/src/orchestrator";

const MAX_TITLE_LEN = 140;
const MAX_BRIEF_LEN = 4000;
const MAX_AGENTS_PER_SUBMISSION = 6; // bounds worst-case live Phase 1 calls for a brand-new case

// This route only validates and creates the case row — it does NOT run the deliberation.
// The client runs phase1/phase2/phase3 itself afterward via the same
// /api/public/deliberate/phase{1,2,3} endpoints the rerun flow uses (a freshly-created
// "pending" case is eligible there too — see the not-rejected check in those routes), so
// a first-time submission and a later rerun share one code path and one progress UI.
export async function POST(req: NextRequest) {
  const { title, brief, activeDoctrines } = (await req.json()) as {
    title: string;
    brief: string;
    activeDoctrines: DoctrineId[];
  };

  if (!title?.trim() || !brief?.trim()) {
    return NextResponse.json({ error: "title and brief are required" }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LEN) {
    return NextResponse.json({ error: `title must be under ${MAX_TITLE_LEN} characters` }, { status: 400 });
  }
  if (brief.length > MAX_BRIEF_LEN) {
    return NextResponse.json({ error: `brief must be under ${MAX_BRIEF_LEN} characters` }, { status: 400 });
  }
  if (!activeDoctrines?.length || activeDoctrines.length > MAX_AGENTS_PER_SUBMISSION) {
    return NextResponse.json(
      { error: `pick between 1 and ${MAX_AGENTS_PER_SUBMISSION} agents for a new submission` },
      { status: 400 }
    );
  }
  const invalid = activeDoctrines.filter((d) => !ALL_DOCTRINE_IDS.includes(d));
  if (invalid.length) {
    return NextResponse.json({ error: `Unknown doctrine id(s): ${invalid.join(", ")}` }, { status: 400 });
  }

  const substance = await checkCaseSubstance(title.trim(), brief.trim());
  if (!substance.ok) {
    return NextResponse.json({ error: substance.error }, { status: 400 });
  }

  const usage = await checkAndIncrementDailyUsage("submission");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "The sandbox has reached its daily limit for new case submissions. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const { data: caseRow, error } = await supabase
    .from("cases")
    .insert({
      title: title.trim(),
      brief: brief.trim(),
      active_doctrines: activeDoctrines,
      phase2_rounds: 1,
      is_seeded: false,
      is_public: false,
      status: "pending",
      source: "user_submitted",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ case: caseRow });
}
