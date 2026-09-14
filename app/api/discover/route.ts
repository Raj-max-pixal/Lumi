import { NextResponse } from "next/server";
import { buildDiscoverPayloadFromRealtime } from "@/lib/social";

export async function GET() {
  try {
    const payload = buildDiscoverPayloadFromRealtime({
      profiles: {},
      posts: {}
    });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to load discover feed."
      },
      { status: 500 }
    );
  }
}
