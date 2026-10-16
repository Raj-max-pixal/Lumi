import { NextRequest, NextResponse } from "next/server";
import { DEVELOPER_TOPICS } from "@/lib/developer-topics";
import { ExternalReelsResponse } from "@/lib/external-reels";

// Only creator-hosted YouTube embeds. IDs and metadata are curated; Lumi never copies video files.
const curated: Record<string, { videoId: string; title: string; creator: string }[]> = {
  "Internet of Things": [{ videoId: "1ENiVwk8idM", title: "Arduino in 100 Seconds", creator: "Fireship" }, { videoId: "eZ74x6dVYes", title: "Raspberry Pi Explained in 100 Seconds", creator: "Fireship" }],
  "Artificial Intelligence": [{ videoId: "PeMlggyqz0Y", title: "Machine Learning Explained in 100 Seconds", creator: "Fireship" }, { videoId: "x7X9w_GIm1s", title: "Python in 100 Seconds", creator: "Fireship" }],
  "Web Development": [{ videoId: "Tn6-PIqc4UM", title: "React in 100 Seconds", creator: "Fireship" }, { videoId: "DHjqpvDnNGE", title: "JavaScript in 100 Seconds", creator: "Fireship" }, { videoId: "zQnBQ4tB3ZA", title: "TypeScript in 100 Seconds", creator: "Fireship" }, { videoId: "OEV8gMkCHXQ", title: "CSS in 100 Seconds", creator: "Fireship" }],
  "Mobile Development": [{ videoId: "lHhRhPV--G0", title: "Flutter in 100 Seconds", creator: "Fireship" }, { videoId: "gvkqT_Uoahw", title: "React Native in 100 Seconds", creator: "Fireship" }],
  Cybersecurity: [{ videoId: "ey4dXseAODE", title: "Master the Basics of Cybersecurity", creator: "KnowledgeCatch" }],
  "Game Development": [{ videoId: "iqlH4okiQqg", title: "Unity in 100 Seconds", creator: "Fireship" }],
  "Career and Hackathons": [{ videoId: "LPYyjggxNJ4", title: "Hackathon Tips for Beginners", creator: "Dreamer" }, { videoId: "hwP7WQkmECE", title: "Git Explained in 100 Seconds", creator: "Fireship" }],
  "Cloud Computing": [{ videoId: "Gjnup-PuquQ", title: "Docker in 100 Seconds", creator: "Fireship" }, { videoId: "rrB13utjYV4", title: "Linux in 100 Seconds", creator: "Fireship" }, { videoId: "vAoB4VbhRzM", title: "Firebase in 100 Seconds", creator: "Fireship" }],
  "Open Source": [{ videoId: "hwP7WQkmECE", title: "Git Explained in 100 Seconds", creator: "Fireship" }],
  Robotics: [{ videoId: "1ENiVwk8idM", title: "Arduino in 100 Seconds", creator: "Fireship" }, { videoId: "eZ74x6dVYes", title: "Raspberry Pi Explained in 100 Seconds", creator: "Fireship" }],
  "Data Science": [{ videoId: "x7X9w_GIm1s", title: "Python in 100 Seconds", creator: "Fireship" }, { videoId: "PeMlggyqz0Y", title: "Machine Learning Explained in 100 Seconds", creator: "Fireship" }],
  "UI/UX Design": [{ videoId: "OEV8gMkCHXQ", title: "CSS in 100 Seconds", creator: "Fireship" }]
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
