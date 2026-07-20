// AUTO-GENERATED API route for the "Baruch Spinoza" agent. Only network-reachable entry point.
import { NextRequest, NextResponse } from "next/server";
import { deliberate } from "@/src/agents/spinoza";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await deliberate(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Agent spinoza failed" }, { status: 500 });
  }
}
