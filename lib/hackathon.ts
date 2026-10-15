export const PROJECT_CATEGORIES = [
  "Artificial Intelligence / Machine Learning", "Web Development", "Mobile App Development",
  "Cybersecurity", "Game Development", "Cloud Computing", "Internet of Things",
  "Open Source", "Other"
] as const;

export type HackathonProject = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  tagline?: string;
  description: string;
  category?: string;
  technologies?: string[];
  websiteUrl: string;
  githubUrl: string;
  videoUrl?: string;
  imageUrls?: string[];
  hackathonName?: string;
  teamMembers?: string[];
  serverId?: string;
  createdAt: number;
  likedBy?: Record<string, true>;
  savedBy?: Record<string, true>;
  comments?: Record<string, { authorId: string; authorName: string; body: string; createdAt: number }>;
};

export type HackathonServer = {
  id: string; name: string; details: string; domain: string; ownerId: string; createdAt: number;
  members?: Record<string, true>;
  messages?: Record<string, { authorId: string; authorName: string; text: string; createdAt: number }>;
};

export function isSafeUrl(value: string, github = false) {
  try {
    const parsed = new URL(value);
    return value === value.trim() && value.length <= 2048 && parsed.protocol === "https:" && !parsed.username && !parsed.password && (!github || ["github.com", "www.github.com"].includes(parsed.hostname));
  } catch {
    return false;
  }
}

export function youtubeVideoId(value: string): string | null {
  if (!isSafeUrl(value)) return null;
  const url = new URL(value);
  let id = "";
  if (url.hostname === "youtu.be") id = url.pathname.slice(1);
  else if (["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname)) {
    id = url.pathname === "/watch" ? url.searchParams.get("v") ?? "" : url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)\/?$/)?.[1] ?? "";
  }
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export function formatProjectDate(timestamp: number) {
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(timestamp) : "Recently";
}
