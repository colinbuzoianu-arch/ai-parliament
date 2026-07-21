import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { runPhase1, type DoctrineId } from "@/src/orchestrator";

export async function POST(req: NextRequest) {
  const { caseId } = (await req.json()) as { caseId: string };
  if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 });

  const { data: caseRow, error } = await supabase.from("cases").select("*").eq("id", caseId).single();
  if (error || !caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  // baseUrl is required because the orchestrator calls agents over real HTTP,
  // not via direct import — set this to your deployed origin (or http://localhost:3000 locally).
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) return NextResponse.json({ error: "APP_BASE_URL env var not set" }, { status: 500 });

  try {
    const phase1 = await runPhase1({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines: caseRow.active_doctrines as DoctrineId[],
      baseUrl,
    });
    return NextResponse.json({ phase1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Phase 1 failed" }, { status: 500 });
  }
}
