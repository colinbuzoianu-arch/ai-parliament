import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { runPhase3 } from "@/src/orchestrator";
import type { AgentRecord } from "@/src/aggregator";

export async function POST(req: NextRequest) {
  const { caseId, phase2Final } = (await req.json()) as { caseId: string; phase2Final: AgentRecord[] };
  if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  if (!phase2Final?.length) return NextResponse.json({ error: "phase2Final results are required" }, { status: 400 });

  const { data: caseRow, error } = await supabase.from("cases").select("id").eq("id", caseId).single();
  if (error || !caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  try {
    const phase3 = await runPhase3({ caseId, phase2Results: phase2Final });
    return NextResponse.json({ phase3 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Phase 3 failed" }, { status: 500 });
  }
}
