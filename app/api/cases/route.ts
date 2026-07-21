import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";
import { checkCaseSubstance } from "@/src/lib/caseGate";
import { ALL_DOCTRINE_IDS, DEFAULT_DOCTRINE_IDS } from "@/src/orchestrator";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, brief, activeDoctrines, phase2Rounds } = body as {
    title: string;
    brief: string;
    activeDoctrines?: string[];
    phase2Rounds?: number;
  };

  if (!title || !brief) {
    return NextResponse.json({ error: "title and brief are required" }, { status: 400 });
  }

  const substance = await checkCaseSubstance(title.trim(), brief.trim());
  if (!substance.ok) {
    return NextResponse.json({ error: substance.error }, { status: 400 });
  }

  const roster = activeDoctrines?.length ? activeDoctrines : DEFAULT_DOCTRINE_IDS;
  const invalid = roster.filter((d) => !ALL_DOCTRINE_IDS.includes(d as any));
  if (invalid.length) {
    return NextResponse.json({ error: `Unknown doctrine id(s): ${invalid.join(", ")}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      title,
      brief,
      active_doctrines: roster,
      phase2_rounds: phase2Rounds ?? 2,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabase.from("cases").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
