// AUTO-GENERATED API route for the "Aleksandr Solzhenitsyn" agent. Only network-reachable entry point.
import { NextRequest, NextResponse } from "next/server";
import { deliberate } from "@/src/agents/solzhenitsyn";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await deliberate(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Agent solzhenitsyn failed" }, { status: 500 });
  }
}
