"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";
import { FeedAuthor, TrendingTopic } from "@/lib/social";
import { LumiViewer } from "@/components/AuthPanel";
import { FirebaseProfile, toggleFollowUser } from "@/lib/social-firebase";
import { onValue, ref } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import { useEffect, useState } from "react";

export default function RightRail({
  users,
  trending,
  viewer,
  isFocusMode = false
}: {
  users: FeedAuthor[];
  trending: TrendingTopic[];
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [viewerProfile, setViewerProfile] = useState<FirebaseProfile | null>(null);

  useEffect(() => {
    if (!viewer) {
      setFollowingIds([]);
      setViewerProfile(null);
      return;
    }

    const followingRef = ref(realtimeDb, `relationships/following/${viewer.id}`);
    const profileRef = ref(realtimeDb, `publicProfiles/${viewer.id}`);

    const unsubFollowing = onValue(followingRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, { createdAt: number }> | null;
      setFollowingIds(value ? Object.keys(value) : []);
    });

    const unsubProfile = onValue(profileRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Omit<FirebaseProfile, "id"> | null;
      setViewerProfile(value ? { id: viewer.id, ...value } : null);
    });

    return () => {
      unsubFollowing();
      unsubProfile();
    };
  }, [viewer]);

  return (
    <div className="space-y-6">
      <section className={`rounded-[24px] border p-5 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full">
            <Image
              src={viewerProfile?.avatar ?? viewer?.avatar ?? "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile"}
              alt={viewerProfile?.name ?? viewer?.name ?? "Lumi"}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>
              {viewerProfile?.name ?? viewer?.name ?? "Guest"}
            </p>
            <p className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/55"}>@{(viewer?.id ?? "lumi").slice(0, 8)}</p>
          </div>
        </div>
      </section>

      <section className={`rounded-[24px] border p-5 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="mb-4 flex items-center justify-between">
          <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Suggestions for you</p>
          <button type="button" className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/55"}>
            See all
          </button>
        </div>
        <div className="space-y-4">
          {users.slice(0, 5).map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-full">
                <Image src={user.avatar} alt={user.name} fill unoptimized className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/profile/${user.id}`} className={`truncate text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>
                  {user.name}
                </Link>
                <p className={isFocusMode ? "truncate text-xs text-slate-500" : "truncate text-xs text-white/55"}>
                  {user.username} • {user.city}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  viewer && viewerProfile
                    ? void toggleFollowUser({
                        currentUserId: viewer.id,
                        currentUserName: viewer.name,
                        targetUserId: user.id,
                        targetUserName: user.name,
                        isFollowing: followingIds.includes(user.id),
                        currentFollowingCount: viewerProfile.followingCount ?? followingIds.length,
                        targetFollowersCount: 0
                      })
                    : undefined
                }
                className="text-xs font-semibold text-lumi-purple"
              >
                {followingIds.includes(user.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={`rounded-[24px] border p-5 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-lumi-purple" />
          <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Trending</p>
        </div>
        <div className="space-y-3">
          {trending.slice(0, 4).map((topic) => (
            <Link key={topic.id} href={`/explore?tag=${encodeURIComponent(topic.label)}`} className="block rounded-xl px-2 py-1 transition hover:bg-sky-400/10">
              <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{topic.label}</p>
              <p className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/55"}>{topic.posts}</p>
            </Link>
          ))}
        </div>
        <div className={`mt-5 border-t pt-4 ${isFocusMode ? "border-slate-200 text-slate-500" : "border-white/10 text-white/55"}`}>
          <div className="inline-flex items-center gap-2 text-xs">
            <Bookmark className="h-4 w-4" />
            Saved posts stay attached to your account.
          </div>
        </div>
      </section>
    </div>
  );
}
