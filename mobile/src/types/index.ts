export type LumiUser = {
  id: string;
  name: string;
  avatar: string;
  username?: string;
  email?: string;
};

export type CommunityPost = {
  id: string;
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
  comments?: Record<string, CommentRecord>;
  likedBy?: Record<string, true>;
  savedBy?: Record<string, true>;
};

export type CommentRecord = {
  authorId: string;
  authorName: string;
  authorHandle: string;
  body: string;
  createdAt: number;
};

export type Story = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  createdAt: number;
  expiresAt: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
};

export type ChatPerson = {
  id: string;
  name: string;
  avatar: string;
  username?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  senderId?: string;
};

export type FirebaseProfile = {
  id: string;
  name: string;
  avatar: string;
  username?: string;
  bio?: string;
  city?: string;
  showLocation?: boolean;
  skills?: string[];
  interests?: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  featuredProjectIds?: string[];
  followersCount?: number;
  followingCount?: number;
};

export type HackathonProject = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  technologies?: string[];
  websiteUrl: string;
  githubUrl: string;
  imageUrls?: string[];
  videoUrl?: string;
  hackathonName: string;
  teamMembers?: string[];
  serverId?: string;
  createdAt: number;
  likedBy?: Record<string, true>;
  savedBy?: Record<string, true>;
  comments?: Record<string, CommentRecord>;
};
