import { NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("cases")
    .select("id, title, brief, active_doctrines, source, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
