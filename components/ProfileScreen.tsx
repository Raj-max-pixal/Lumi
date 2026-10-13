"use client";

import Image from "next/image";
import Link from "next/link";
import { Grid3X3, PlaySquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";
import EditProfilePanel from "@/components/EditProfilePanel";
import LumiCard from "@/components/LumiCard";
import { FirebaseProfile, toggleFollowUser } from "@/lib/social-firebase";

type ProfileScreenProps = {
  viewer: LumiViewer | null;
  profileUserId?: string | null;
  isFocusMode?: boolean;
};

type ProfilePost = {
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
  savedBy?: Record<string, true>;
  tags?: string[];
};

export default function ProfileScreen({
  viewer,
  profileUserId,
  isFocusMode = false
}: ProfileScreenProps) {
  const targetUserId = profileUserId || viewer?.id || null;
  const [profile, setProfile] = useState<FirebaseProfile | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [viewerFollowing, setViewerFollowing] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");

  useEffect(() => {
    if (!targetUserId) {
      return;
    }

    const profileRef = ref(realtimeDb, `publicProfiles/${targetUserId}`);
    const postsRef = ref(realtimeDb, "community/posts");
    const followersRef = ref(realtimeDb, `relationships/followers/${targetUserId}`);
    const followingRef = ref(realtimeDb, `relationships/following/${targetUserId}`);

    const unsubProfile = onValue(profileRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Omit<FirebaseProfile, "id"> | null;
      setProfile(value ? { id: targetUserId, ...value } : null);
    });

    const unsubPosts = onValue(postsRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, Omit<ProfilePost, "id">> | null;
      if (!value) {
        setPosts([]);
        return;
      }

      const nextPosts = Object.entries(value)
        .map(([id, payload]) => ({ id, ...payload }))
        .filter((post) => post.authorId === targetUserId)
        .sort((a, b) => b.createdAt - a.createdAt);

      setPosts(nextPosts);
    });

    const unsubFollowers = onValue(followersRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, { createdAt: number }> | null;
      setFollowers(value ? Object.keys(value) : []);
    });

    const unsubFollowing = onValue(followingRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, { createdAt: number }> | null;
      setFollowing(value ? Object.keys(value) : []);
    });

    return () => {
      unsubProfile();
      unsubPosts();
      unsubFollowers();
      unsubFollowing();
    };
  }, [targetUserId]);

  useEffect(() => {
    if (!viewer) {
      setViewerFollowing([]);
      return;
    }

    const followingRef = ref(realtimeDb, `relationships/following/${viewer.id}`);
    const unsubscribe = onValue(followingRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, { createdAt: number }> | null;
      setViewerFollowing(value ? Object.keys(value) : []);
    });

    return () => unsubscribe();
  }, [viewer]);

  const isOwnProfile = Boolean(viewer && targetUserId === viewer.id);
  const isFollowing = Boolean(targetUserId && viewerFollowing.includes(targetUserId));

  const safeProfile = useMemo(
    () =>
      profile ?? {
        id: targetUserId ?? "unknown",
        name: "Lumi User",
        username: `@${(targetUserId ?? "unknown").slice(0, 8)}`,
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile",
        bio: "",
        city: "",
        followersCount: followers.length,
        followingCount: following.length
      },
    [profile, targetUserId, followers.length, following.length]
  );

  const tabbedPosts = useMemo(() => {
    if (activeTab === "reels") {
      return posts.filter((post) => Boolean(post.videoUrl));
    }

    return posts;
  }, [activeTab, posts]);

  async function handleFollowToggle() {
    if (!viewer || !targetUserId || targetUserId === viewer.id) {
      return;
    }

    await toggleFollowUser({
      currentUserId: viewer.id,
      currentUserName: viewer.name,
      targetUserId,
      targetUserName: safeProfile.name,
      isFollowing,
      currentFollowingCount: viewerFollowing.length,
      targetFollowersCount: followers.length
    });
  }

  return (
    <div className="space-y-6">
      <section className={`rounded-[24px] border p-6 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-full border border-slate-200">
            <Image src={safeProfile.avatar} alt={safeProfile.name} fill className="object-cover" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <div><p className={`text-2xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{safeProfile.name}</p><p className="text-sm opacity-60">{safeProfile.username ?? `@${safeProfile.id.slice(0, 8)}`}</p></div>
                {!isOwnProfile && viewer ? (
                  <button
                    type="button"
                    onClick={() => void handleFollowToggle()}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      isFollowing ? (isFocusMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white") : "bg-lumi-purple text-white"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                ) : null}
              </div>
              <p className={`mt-4 whitespace-pre-line text-sm ${isFocusMode ? "text-slate-700" : "text-white/80"}`}>{safeProfile.bio || "No bio yet."}</p>
              <p className={isFocusMode ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-white/60"}>{safeProfile.city || "Location hidden"}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Posts", value: posts.length },
                { label: "Followers", value: followers.length },
                { label: "Following", value: following.length },
                { label: "Saves", value: posts.reduce((sum, post) => sum + Object.keys(post.savedBy ?? {}).length, 0) }
              ].map((item) => (
                <div key={item.label} className="p-1">
                  <p className={`text-xl font-semibold ${isFocusMode ? "text-slate-950" : "text-white"}`}>{item.value}</p>
                  <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/50"}>{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-[18px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
                <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Followers</p>
                <div className="mt-3 space-y-2">
                  {followers.length ? followers.slice(0, 5).map((id) => (
                    <Link key={id} href={`/profile/${id}`} className={isFocusMode ? "block text-sm text-slate-600 hover:text-slate-900" : "block text-sm text-white/75 hover:text-white"}>
                      @{id.slice(0, 8)}
                    </Link>
                  )) : (
                    <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>No followers yet.</p>
                  )}
                </div>
              </div>

              <div className={`rounded-[18px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
                <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Following</p>
                <div className="mt-3 space-y-2">
                  {following.length ? following.slice(0, 5).map((id) => (
                    <Link key={id} href={`/profile/${id}`} className={isFocusMode ? "block text-sm text-slate-600 hover:text-slate-900" : "block text-sm text-white/75 hover:text-white"}>
                      @{id.slice(0, 8)}
                    </Link>
                  )) : (
                    <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>Not following anyone yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isOwnProfile ? <EditProfilePanel viewer={viewer} isFocusMode={isFocusMode} /> : null}

      <section className="space-y-5">
        <div className={`flex items-center justify-center gap-2 border-y py-3 ${isFocusMode ? "border-slate-200" : "border-white/10"}`}>
          {[
            { id: "posts", label: "Posts", icon: Grid3X3 },
            { id: "reels", label: "Reels", icon: PlaySquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as "posts" | "reels")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                activeTab === id
                  ? isFocusMode
                    ? "bg-slate-100 text-slate-950"
                    : "bg-white/10 text-white"
                  : isFocusMode
                    ? "text-slate-500"
                    : "text-white/55"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tabbedPosts.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {tabbedPosts.map((post) => (
              <LumiCard
                key={post.id}
                contentType={post.videoUrl ? "video" : post.imageUrl ? "image" : "thread"}
                isFocusMode={isFocusMode}
                author={post.authorName}
                handle={`@${post.authorId.slice(0, 8)}`}
                avatarUrl={post.authorAvatar}
                title={post.imageUrl ? "Profile post" : "Profile thread"}
                description={post.caption}
                imageUrl={post.imageUrl}
                videoUrl={post.videoUrl}
                likes={post.likes}
                commentsCount={post.commentsCount}
                shares={post.shares}
                tags={post.tags ?? ["Profile", "Post"]}
              />
            ))}
          </div>
        ) : (
          <div className={`rounded-[24px] border p-8 text-center ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
            <p className={`text-xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Nothing in this tab yet</p>
            <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
              Switch tabs or publish more content to grow this profile.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
