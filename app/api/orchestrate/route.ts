import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { runDeliberation, type DoctrineId } from "@/src/orchestrator";

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
    const result = await runDeliberation({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines: caseRow.active_doctrines as DoctrineId[],
      phase2Rounds: caseRow.phase2_rounds,
      baseUrl,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Deliberation failed" }, { status: 500 });
  }
}
