"use client";

import { DiscoverPayload } from "@/lib/social";
import LumiCard from "@/components/LumiCard";

export default function ReelsFeed({
  feed,
  isFocusMode = false
}: {
  feed: DiscoverPayload["feed"];
  isFocusMode?: boolean;
}) {
  const reels = feed.filter((item) => item.contentType === "video");

  return (
    <div className="space-y-4">
      <section className={`rounded-[24px] border p-5 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <p className={`text-2xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Reels</p>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
          Swipe-style short videos with snap scrolling.
        </p>
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
            />
          </div>
        ))}
      </div>
    </div>
  );
}
