import { NextRequest, NextResponse } from "next/server";
import { aiToolbox, AIPersonalityMode } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    tool?:
      | "caption"
      | "hashtags"
      | "viral-ideas"
      | "thread"
      | "bio"
      | "image"
      | "video"
      | "voice"
      | "avatar"
      | "assistant"
      | "growth"
      | "job"
      | "feed-control"
      | "moderation"
      | "translator"
      | "auto-reply";
    prompt?: string;
    personality?: AIPersonalityMode;
  };

  const text = await aiToolbox({
    tool: body.tool ?? "assistant",
    prompt: body.prompt ?? "",
    personality: body.personality ?? "mentor"
  });

  return NextResponse.json({ text });
}
