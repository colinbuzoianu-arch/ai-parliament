import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { runPhase2, type DoctrineId } from "@/src/orchestrator";
import type { AgentRecord } from "@/src/aggregator";

export async function POST(req: NextRequest) {
  const { caseId, phase1 } = (await req.json()) as { caseId: string; phase1: AgentRecord[] };
  if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  if (!phase1?.length) return NextResponse.json({ error: "phase1 results are required" }, { status: 400 });

  const { data: caseRow, error } = await supabase.from("cases").select("*").eq("id", caseId).single();
  if (error || !caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) return NextResponse.json({ error: "APP_BASE_URL env var not set" }, { status: 500 });

  try {
    const phase2Final = await runPhase2({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines: caseRow.active_doctrines as DoctrineId[],
      phase2Rounds: caseRow.phase2_rounds,
      phase1Results: phase1,
      baseUrl,
    });
    return NextResponse.json({ phase2Final });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Phase 2 failed" }, { status: 500 });
  }
}
