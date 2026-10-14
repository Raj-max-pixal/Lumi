export type FeedAuthor = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  city: string;
};

export type FeedComment = {
  id: string;
  author: string;
  handle: string;
  body: string;
  upvotes: number;
  avatar?: string;
  children?: FeedComment[];
};

export type FeedItem = {
  id: string;
  contentType: "video" | "image" | "thread";
  author: FeedAuthor;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: number;
  commentsCount: number;
  shares: number;
  createdAt?: number;
  tags: string[];
  comments?: FeedComment[];
  likedBy?: Record<string, true>;
  savedBy?: Record<string, true>;
};

export type TrendingTopic = {
  id: string;
  label: string;
  posts: string;
};

export type DiscoverPayload = {
  featuredUsers: FeedAuthor[];
  feed: FeedItem[];
  trending: TrendingTopic[];
};

export type RealtimeProfileRecord = {
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  showLocation?: boolean;
  interests?: string[];
};

export type RealtimeCommentRecord = {
  authorId: string;
  authorName: string;
  authorHandle: string;
  body: string;
  createdAt: number;
};

export type RealtimePostRecord = {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: number;
  likes: number;
  commentsCount: number;
  shares: number;
  savedCount?: number;
  tags?: string[];
  comments?: Record<string, RealtimeCommentRecord>;
  likedBy?: Record<string, true>;
  savedBy?: Record<string, true>;
};

function buildUsername(value: string, fallbackId: string) {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (cleaned) {
    return `@${cleaned}`;
  }

  return `@${fallbackId.slice(0, 8)}`;
}

function titleFromCaption(caption: string, contentType: FeedItem["contentType"]) {
  const trimmed = caption.trim();
  if (!trimmed) {
    return contentType === "image" ? "Photo post" : contentType === "video" ? "Reel" : "Thread";
  }

  return trimmed.length > 54 ? `${trimmed.slice(0, 54).trim()}...` : trimmed;
}

function extractTags(caption: string) {
  const matches = caption.match(/#[a-z0-9_]+/gi) ?? [];
  return [...new Set(matches.map((tag) => tag.trim()))];
}

export function buildDiscoverPayloadFromRealtime(args: {
  profiles: Record<string, RealtimeProfileRecord>;
  posts: Record<string, RealtimePostRecord>;
}): DiscoverPayload {
  const { profiles, posts } = args;

  const featuredUsers: FeedAuthor[] = Object.entries(profiles)
    .map(([id, profile]) => ({
      id,
      name: profile.name?.trim() || "Lumi User",
      username: profile.username?.startsWith("@") ? profile.username : buildUsername(profile.username ?? profile.name ?? "", id),
      avatar: profile.avatar || "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile",
      city: profile.showLocation ? profile.city?.trim() || "Lumi" : "Lumi"
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const feed: FeedItem[] = Object.entries(posts)
    .map(([id, post]) => {
      const authorProfile = profiles[post.authorId];
      const author: FeedAuthor = {
        id: post.authorId,
        name: authorProfile?.name?.trim() || post.authorName || "Lumi User",
        username:
          authorProfile?.username?.startsWith("@")
            ? authorProfile.username
            : buildUsername(authorProfile?.username ?? authorProfile?.name ?? "", post.authorId),
        avatar: authorProfile?.avatar || post.authorAvatar || "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile",
        city: authorProfile?.showLocation ? authorProfile.city?.trim() || "Lumi" : "Lumi"
      };

      const tags = post.tags?.length ? post.tags : extractTags(post.caption);
      const contentType: FeedItem["contentType"] = post.videoUrl ? "video" : post.imageUrl ? "image" : "thread";

      return {
        id,
        contentType,
        author,
        title: titleFromCaption(post.caption, contentType),
        description: post.caption,
        imageUrl: post.imageUrl || undefined,
        videoUrl: post.videoUrl || undefined,
        likes: Object.keys(post.likedBy ?? {}).length,
        commentsCount: Object.keys(post.comments ?? {}).length,
        shares: post.shares ?? 0,
        createdAt: post.createdAt,
        tags: tags.length ? tags : [contentType === "image" ? "Photo" : contentType === "video" ? "Reel" : "Thread"],
        comments: Object.entries(post.comments ?? {})
          .map(([commentId, comment]) => ({
            id: commentId,
            author: comment.authorName,
            handle: comment.authorHandle,
            body: comment.body,
            upvotes: 1
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
        likedBy: post.likedBy ?? {},
        savedBy: post.savedBy ?? {}
      };
    })
    .sort((a, b) => b.likes + b.commentsCount * 2 - (a.likes + a.commentsCount * 2));

  const hashtagCount = new Map<string, number>();
  feed.forEach((item) => {
    item.tags.forEach((tag) => {
      const normalized = tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`;
      hashtagCount.set(normalized, (hashtagCount.get(normalized) ?? 0) + 1);
    });
  });

  const trending: TrendingTopic[] = [...hashtagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count], index) => ({
      id: `${index + 1}`,
      label,
      posts: `${count} ${count === 1 ? "post" : "posts"}`
    }));

  return {
    featuredUsers,
    feed,
    trending
  };
}
