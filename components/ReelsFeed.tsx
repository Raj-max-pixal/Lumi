"use client";

import { DiscoverPayload } from "@/lib/social";
import LumiCard from "@/components/LumiCard";
import { LumiViewer } from "@/components/AuthPanel";
import { togglePostLike, togglePostSave } from "@/lib/social-firebase";

export default function ReelsFeed({
  feed,
  viewer,
  isFocusMode = false
}: {
  feed: DiscoverPayload["feed"];
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  const reels = feed.filter((item) => item.contentType === "video");

  return (
    <div className="space-y-4">
      <section className={`rounded-[24px] border p-5 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <p className={`text-2xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Reels</p>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>Videos shared by Lumi creators.</p>
      </section>

      <div className="h-[78vh] snap-y snap-mandatory space-y-4 overflow-y-auto pr-1">
        {reels.map((item) => (
          <div key={item.id} className="snap-start">
            <LumiCard
              contentType="video"
              isFocusMode={isFocusMode}
              author={item.author.name}
              handle={item.author.username}
              avatarUrl={item.author.avatar}
              title={item.title}
              description={item.description}
              videoUrl={item.videoUrl}
              likes={item.likes}
              commentsCount={item.commentsCount}
              shares={item.shares}
              tags={item.tags}
              onLike={viewer ? () => void togglePostLike(item.id, viewer.id, Boolean(item.likedBy?.[viewer.id])) : undefined}
              onSave={viewer ? () => void togglePostSave(item.id, viewer.id, Boolean(item.savedBy?.[viewer.id])) : undefined}
              isLiked={Boolean(viewer && item.likedBy?.[viewer.id])}
              isSaved={Boolean(viewer && item.savedBy?.[viewer.id])}
            />
          </div>
        ))}
        {!reels.length ? <p className="rounded-[24px] border border-current/10 p-8 text-center text-sm opacity-60">No reels yet. Upload a video to share the first one.</p> : null}
      </div>
    </div>
  );
}
