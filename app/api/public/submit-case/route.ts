import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { checkCaseSubstance } from "@/src/lib/caseGate";
import {
  runPublicPhase1,
  runPublicPhase2,
  runPhase3,
  checkAndIncrementDailyUsage,
  ALL_DOCTRINE_IDS,
  type DoctrineId,
} from "@/src/orchestrator";

const MAX_TITLE_LEN = 140;
const MAX_BRIEF_LEN = 4000;
const MAX_AGENTS_PER_SUBMISSION = 6; // bounds worst-case live Phase 1 calls for a brand-new case

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

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) return NextResponse.json({ error: "APP_BASE_URL env var not set" }, { status: 500 });

  const { data: caseRow, error } = await supabase
    .from("cases")
    .insert({
      title: title.trim(),
      brief: brief.trim(),
      active_doctrines: activeDoctrines,
      phase2_rounds: 1,
      is_seeded: false,
      is_public: false, // stays hidden from the public gallery until an admin approves it
      status: "pending",
      source: "user_submitted",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    // Self-healing cache in runPublicPhase1 handles Phase 1 live since nothing is cached
    // yet for this brand-new case. This submission flow runs all three phases in one
    // server-side pass (there's no interactive per-phase UI here, unlike the root page's
    // rerun flow, which calls each phase as a separate request to show live progress).
    const phase1 = await runPublicPhase1({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines,
      baseUrl,
    });
    const phase2Final = await runPublicPhase2({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines,
      phase1Results: phase1,
      baseUrl,
    });
    const phase3 = await runPhase3({ caseId: caseRow.id, phase2Results: phase2Final, isPublic: true });
    return NextResponse.json({ case: caseRow, phase1, phase2Final, phase3 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Deliberation failed" }, { status: 500 });
  }
}
