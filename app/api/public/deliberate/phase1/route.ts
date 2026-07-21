import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { runPublicPhase1, checkAndIncrementDailyUsage, type DoctrineId } from "@/src/orchestrator";
import { isLocale, type Locale } from "@/src/i18n/locale";

export async function POST(req: NextRequest) {
  const { caseId, activeDoctrines, locale } = (await req.json()) as {
    caseId: string;
    activeDoctrines: DoctrineId[];
    locale?: Locale;
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

  // Not gated on "approved" — that status only controls gallery visibility (removed) and
  // whether an admin has actively reviewed the case. A brand-new submission is "pending"
  // and must still be rerunnable with a different panel right after submitting. Only an
  // explicit admin rejection blocks further live runs.
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
    const phase1 = await runPublicPhase1({
      caseId: caseRow.id,
      caseBrief: caseRow.brief,
      activeDoctrines,
      baseUrl,
      locale: isLocale(locale) ? locale : undefined,
    });
    return NextResponse.json({ phase1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Phase 1 failed" }, { status: 500 });
  }
}
