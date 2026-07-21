import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { runPublicPhase2, type DoctrineId } from "@/src/orchestrator";
import type { AgentRecord } from "@/src/aggregator";

export async function POST(req: NextRequest) {
  const { caseId, activeDoctrines, phase1 } = (await req.json()) as {
    caseId: string;
    activeDoctrines: DoctrineId[];
    phase1: AgentRecord[];
  };

  if (!caseId || !activeDoctrines?.length) {
    return NextResponse.json({ error: "caseId and activeDoctrines are required" }, { status: 400 });
  }
  if (!phase1?.length) return NextResponse.json({ error: "phase1 results are required" }, { status: 400 });

  // See phase1/route.ts: rerun is gated on not-rejected, not on "approved" — "approved" only
  // controls gallery visibility (removed) and admin review, not whether a case can be run.
  const { data: caseRow, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .neq("status", "rejected")
    .single();

  if (error || !caseRow) return NextResponse.json({ error: "Public case not found" }, { status: 404 });

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) return NextResponse.json({ error: "APP_BASE_URL env var not set" }, { status: 500 });

  try {
    const phase2Final = await runPublicPhase2({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines,
      phase1Results: phase1,
      baseUrl,
    });
    return NextResponse.json({ phase2Final });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Phase 2 failed" }, { status: 500 });
  }
}
