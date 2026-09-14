import { push, ref, remove, set } from "firebase/database";
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
  await set(ref(realtimeDb, `profiles/${profile.id}/public`), {
    name: profile.name,
    avatar: profile.avatar,
    username: profile.username ?? `@${profile.id.slice(0, 8)}`,
    bio: profile.bio ?? "",
    city: profile.city ?? "",
    followersCount: profile.followersCount ?? 0,
    followingCount: profile.followingCount ?? 0
  });
}

export async function createNotification(userId: string, title: string, body: string) {
  const notificationRef = push(ref(realtimeDb, `notifications/${userId}`));
  await set(notificationRef, {
    title,
    body,
    createdAt: Date.now()
  });
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
    isFollowing,
    currentFollowingCount,
    targetFollowersCount
  } = args;

  const followingRef = ref(realtimeDb, `relationships/following/${currentUserId}/${targetUserId}`);
  const followerRef = ref(realtimeDb, `relationships/followers/${targetUserId}/${currentUserId}`);

  if (isFollowing) {
    await remove(followingRef);
    await remove(followerRef);
    await set(ref(realtimeDb, `profiles/${currentUserId}/public/followingCount`), Math.max(0, currentFollowingCount - 1));
    await set(ref(realtimeDb, `profiles/${targetUserId}/public/followersCount`), Math.max(0, targetFollowersCount - 1));
    return;
  }

  await set(followingRef, {
    createdAt: Date.now()
  });
  await set(followerRef, {
    createdAt: Date.now()
  });
  await set(ref(realtimeDb, `profiles/${currentUserId}/public/followingCount`), currentFollowingCount + 1);
  await set(ref(realtimeDb, `profiles/${targetUserId}/public/followersCount`), targetFollowersCount + 1);
  await createNotification(targetUserId, "New follower", `${currentUserName} started following ${targetUserName}.`);
}
