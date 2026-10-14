import { NextRequest, NextResponse } from "next/server";
import { DEVELOPER_TOPICS } from "@/lib/developer-topics";
import { ExternalReel, ExternalReelsResponse } from "@/lib/external-reels";

const searches: Record<string, string> = {
  "Internet of Things": "IoT Arduino ESP32 student project tutorial",
  "Artificial Intelligence": "AI machine learning coding tutorial project",
  "Web Development": "web development React JavaScript coding tutorial",
  "Mobile Development": "Flutter Android mobile app development tutorial",
  Cybersecurity: "cybersecurity ethical hacking beginner tutorial",
  "Game Development": "game development Unity beginner tutorial",
  "Cloud Computing": "cloud DevOps Docker tutorial",
  "Open Source": "open source GitHub contribution tutorial",
  Robotics: "robotics Arduino project tutorial",
  "Data Science": "Python data science beginner tutorial",
  "UI/UX Design": "UI UX Figma design tutorial",
  "Career and Hackathons": "student hackathon portfolio developer tips"
};

type SearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string; description?: string; channelTitle?: string; publishedAt?: string };
};

// Creator-hosted embeds, hand checked for the initial no-key experience. No video is copied to Lumi.
const curated: Record<string, { videoId: string; title: string; creator: string }[]> = {
  "Internet of Things": [{ videoId: "1ENiVwk8idM", title: "Arduino in 100 Seconds", creator: "Fireship" }],
  "Web Development": [{ videoId: "Tn6-PIqc4UM", title: "React in 100 Seconds", creator: "Fireship" }],
  "Mobile Development": [{ videoId: "lHhRhPV--G0", title: "Flutter in 100 seconds", creator: "Fireship" }],
  "Cloud Computing": [{ videoId: "Gjnup-PuquQ", title: "Docker in 100 Seconds", creator: "Fireship" }]
};

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get("topic") ?? "Web Development";
  if (!DEVELOPER_TOPICS.some((value) => value === topic)) {
    return NextResponse.json({ items: [], configured: true, error: "Choose a valid developer topic." } satisfies ExternalReelsResponse, { status: 400 });
  }
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ items: (curated[topic] ?? []).map((video) => ({ id: `youtube:${video.videoId}`, source: "youtube" as const, ...video, description: "A curated, creator-hosted developer lesson.", topic, publishedAt: "" })), configured: false } satisfies ExternalReelsResponse);

  const params = new URLSearchParams({
    key, part: "snippet", type: "video", maxResults: "8", order: "date",
    videoDuration: "short", videoEmbeddable: "true", safeSearch: "strict",
    q: searches[topic]
  });
  try {
    const result = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, { next: { revalidate: 3600 } });
    if (!result.ok) throw new Error("YouTube search is temporarily unavailable.");
    const payload = await result.json() as { items?: SearchItem[] };
    const items: ExternalReel[] = (payload.items ?? []).filter((item) => /^[a-zA-Z0-9_-]{11}$/.test(item.id?.videoId ?? "")).map((item) => ({
      id: `youtube:${item.id!.videoId}`,
      source: "youtube",
      videoId: item.id!.videoId!,
      title: item.snippet?.title ?? "Developer video",
      creator: item.snippet?.channelTitle ?? "YouTube creator",
      description: item.snippet?.description ?? "",
      topic,
      publishedAt: item.snippet?.publishedAt ?? ""
    }));
    return NextResponse.json({ items, configured: true } satisfies ExternalReelsResponse);
  } catch {
    return NextResponse.json({ items: [], configured: true, error: "YouTube videos could not load. Please try again later." } satisfies ExternalReelsResponse, { status: 503 });
  }
}
