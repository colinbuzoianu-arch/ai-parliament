// Admin-only: flips a case's moderation status. Protected by a shared secret header (not a
// real auth system) — good enough to keep this out of the public sandbox surface, not
// intended to gate anything more sensitive than what already ships in ADMIN_SECRET.
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabase } from "@/src/lib/supabaseClient";

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "ADMIN_SECRET env var not set" }, { status: 500 });
  }

  const provided = req.headers.get("x-admin-secret");
  if (!provided || !secretsMatch(provided, adminSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId, status } = (await req.json()) as { caseId: string; status?: "approved" | "rejected" };
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required" }, { status: 400 });
  }
  const nextStatus = status === "rejected" ? "rejected" : "approved";

  const { data, error } = await supabase
    .from("cases")
    .update({ status: nextStatus, is_public: nextStatus === "approved" })
    .eq("id", caseId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "case not found" }, { status: 404 });

  return NextResponse.json(data);
}
