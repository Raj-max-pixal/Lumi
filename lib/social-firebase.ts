import { get, push, ref, remove, set, update } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";

export type FirebaseProfile = {
  id: string;
  name: string;
  avatar: string;
  username?: string;
  bio?: string;
  city?: string;
  followersCount?: number;
  followingCount?: number;
};

export async function ensureUserProfile(profile: FirebaseProfile) {
  await update(ref(realtimeDb, `publicProfiles/${profile.id}`), {
    name: profile.name,
    avatar: profile.avatar,
    username: profile.username ?? `@${profile.id.slice(0, 8)}`,
    bio: profile.bio ?? "",
    city: profile.city ?? "",
    ...(profile.followersCount === undefined ? {} : { followersCount: profile.followersCount }),
    ...(profile.followingCount === undefined ? {} : { followingCount: profile.followingCount })
  });
}

export async function createUserProfileIfMissing(profile: FirebaseProfile) {
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
  const likeRef = ref(realtimeDb, `community/posts/${postId}/likedBy/${userId}`);
  if (liked) await remove(likeRef);
  else await set(likeRef, true);
}

export async function togglePostSave(postId: string, userId: string, saved: boolean) {
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

  const followingRef = ref(realtimeDb, `relationships/following/${currentUserId}/${targetUserId}`);
  const followerRef = ref(realtimeDb, `relationships/followers/${targetUserId}/${currentUserId}`);

  if (isFollowing) {
    await remove(followingRef);
    await remove(followerRef);
    return;
  }

  await set(followingRef, {
    createdAt: Date.now()
  });
  await set(followerRef, {
    createdAt: Date.now()
  });
  await createNotification(targetUserId, "New follower", `${currentUserName} started following ${targetUserName}.`);
}
