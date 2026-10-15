import { get, push, ref, remove, set, update } from "firebase/database";
import { auth, realtimeDb } from "@/lib/firebase";

function requireCurrentUser(userId: string) {
  if (!auth.currentUser || auth.currentUser.uid !== userId) throw new Error("Your session changed. Sign in again.");
}

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

export async function ensureUserProfile(profile: FirebaseProfile) {
  requireCurrentUser(profile.id);
  await update(ref(realtimeDb, `publicProfiles/${profile.id}`), {
    name: profile.name,
    avatar: profile.avatar,
    username: profile.username ?? `@${profile.id.slice(0, 8)}`,
    bio: profile.bio ?? "",
    city: profile.city ?? "",
    ...(profile.showLocation === undefined ? {} : { showLocation: profile.showLocation }),
    ...(profile.skills === undefined ? {} : { skills: profile.skills }),
    ...(profile.interests === undefined ? {} : { interests: profile.interests }),
    ...(profile.portfolioUrl === undefined ? {} : { portfolioUrl: profile.portfolioUrl }),
    ...(profile.githubUrl === undefined ? {} : { githubUrl: profile.githubUrl }),
    ...(profile.linkedinUrl === undefined ? {} : { linkedinUrl: profile.linkedinUrl }),
    ...(profile.followersCount === undefined ? {} : { followersCount: profile.followersCount }),
    ...(profile.followingCount === undefined ? {} : { followingCount: profile.followingCount })
  });
}

export async function createUserProfileIfMissing(profile: FirebaseProfile) {
  requireCurrentUser(profile.id);
  const profileRef = ref(realtimeDb, `publicProfiles/${profile.id}`);
  const existing = await get(profileRef);
  if (!existing.exists()) {
    await ensureUserProfile(profile);
  }
}

export async function createNotification(userId: string, title: string, body: string) {
  const notificationRef = push(ref(realtimeDb, `notifications/${userId}`));
  await set(notificationRef, {
    title,
    body,
    createdAt: Date.now()
  });
}

export async function togglePostLike(postId: string, userId: string, liked: boolean) {
  requireCurrentUser(userId);
  const likeRef = ref(realtimeDb, `community/posts/${postId}/likedBy/${userId}`);
  if (liked) await remove(likeRef);
  else await set(likeRef, true);
}

export async function togglePostSave(postId: string, userId: string, saved: boolean) {
  requireCurrentUser(userId);
  const saveRef = ref(realtimeDb, `community/posts/${postId}/savedBy/${userId}`);
  if (saved) await remove(saveRef);
  else await set(saveRef, true);
}

export async function toggleFollowUser(args: {
  currentUserId: string;
  currentUserName: string;
  targetUserId: string;
  targetUserName: string;
  isFollowing: boolean;
  currentFollowingCount: number;
  targetFollowersCount: number;
}) {
  const {
    currentUserId,
    currentUserName,
    targetUserId,
    targetUserName,
    isFollowing
  } = args;
  requireCurrentUser(currentUserId);

  if (isFollowing) {
    await update(ref(realtimeDb), {
      [`relationships/following/${currentUserId}/${targetUserId}`]: null,
      [`relationships/followers/${targetUserId}/${currentUserId}`]: null
    });
    return;
  }

  if (currentUserId === targetUserId) return;
  const createdAt = Date.now();
  await update(ref(realtimeDb), {
    [`relationships/following/${currentUserId}/${targetUserId}`]: { createdAt },
    [`relationships/followers/${targetUserId}/${currentUserId}`]: { createdAt }
  });
  try { await createNotification(targetUserId, "New follower", `${currentUserName} started following ${targetUserName}.`); }
  catch { /* The follow succeeded even if notification delivery failed. */ }
}
