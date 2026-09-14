import { NextRequest, NextResponse } from "next/server";
import { summarizeConversation } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { messages?: string[] };
  const summary = await summarizeConversation(body.messages ?? []);
  return NextResponse.json({ summary });
}
