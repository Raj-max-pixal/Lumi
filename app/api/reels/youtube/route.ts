import { NextRequest, NextResponse } from "next/server";
import { DEVELOPER_TOPICS } from "@/lib/developer-topics";
import { ExternalReelsResponse } from "@/lib/external-reels";

// Only creator-hosted YouTube embeds. IDs and metadata are curated; Lumi never copies video files.
const curated: Record<string, { videoId: string; title: string; creator: string }[]> = {
  "Internet of Things": [{ videoId: "1ENiVwk8idM", title: "Arduino in 100 Seconds", creator: "Fireship" }],
  "Artificial Intelligence": [{ videoId: "PeMlggyqz0Y", title: "Machine Learning Explained in 100 Seconds", creator: "Fireship" }],
  "Web Development": [{ videoId: "Tn6-PIqc4UM", title: "React in 100 Seconds", creator: "Fireship" }],
  "Mobile Development": [{ videoId: "lHhRhPV--G0", title: "Flutter in 100 Seconds", creator: "Fireship" }],
  Cybersecurity: [{ videoId: "ey4dXseAODE", title: "Master the Basics of Cybersecurity", creator: "KnowledgeCatch" }],
  "Game Development": [{ videoId: "iqlH4okiQqg", title: "Unity in 100 Seconds", creator: "Fireship" }],
  "Career and Hackathons": [{ videoId: "LPYyjggxNJ4", title: "Hackathon Tips for Beginners", creator: "Dreamer" }],
  "Cloud Computing": [{ videoId: "Gjnup-PuquQ", title: "Docker in 100 Seconds", creator: "Fireship" }]
};

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get("topic") ?? "Web Development";
  if (!DEVELOPER_TOPICS.some((value) => value === topic)) {
    return NextResponse.json({ items: [], configured: false, error: "Choose a valid developer topic." } satisfies ExternalReelsResponse, { status: 400 });
  }
  return NextResponse.json({
    items: (curated[topic] ?? []).map((video) => ({ id: `youtube:${video.videoId}`, source: "youtube" as const, ...video, description: "A creator-hosted developer lesson.", topic, publishedAt: "" })),
    configured: false
  } satisfies ExternalReelsResponse);
}
