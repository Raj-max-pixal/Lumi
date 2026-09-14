import { NextRequest, NextResponse } from "next/server";
import { magicWrite } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { text?: string };
  const rewritten = await magicWrite(body.text ?? "");
  return NextResponse.json({ text: rewritten });
}
