import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { runPublicDeliberation, checkAndIncrementDailyUsage, type DoctrineId } from "@/src/orchestrator";

export async function POST(req: NextRequest) {
  const { caseId, activeDoctrines } = (await req.json()) as {
    caseId: string;
    activeDoctrines: DoctrineId[];
  };

  if (!caseId || !activeDoctrines?.length) {
    return NextResponse.json({ error: "caseId and activeDoctrines are required" }, { status: 400 });
  }

  const usage = await checkAndIncrementDailyUsage("rerun");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "The sandbox has reached its live-run limit for today. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const { data: caseRow, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("is_public", true)
    .single();

  if (error || !caseRow) return NextResponse.json({ error: "Public case not found" }, { status: 404 });

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) return NextResponse.json({ error: "APP_BASE_URL env var not set" }, { status: 500 });

  try {
    const result = await runPublicDeliberation({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines,
      baseUrl,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Deliberation failed" }, { status: 500 });
  }
}
