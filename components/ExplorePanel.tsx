"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import LumiCard from "@/components/LumiCard";
import { DiscoverPayload, FeedItem } from "@/lib/social";
import { LumiViewer } from "@/components/AuthPanel";
import { togglePostLike, togglePostSave } from "@/lib/social-firebase";

const categories = ["All", "Photos", "Reels", "Threads"] as const;

export default function ExplorePanel({
  data,
  viewer,
  isFocusMode = false,
  initialQuery = ""
}: {
  data: DiscoverPayload;
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const filteredFeed = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    return data.feed.filter((item) => {
      const categoryPass =
        category === "All"
          ? true
          : category === "Photos"
            ? item.contentType === "image"
            : category === "Reels"
              ? item.contentType === "video"
              : item.contentType === "thread";

      const textPass = trimmed
        ? `${item.author.name} ${item.title} ${item.description} ${item.tags.join(" ")}`.toLowerCase().includes(trimmed)
        : true;

      return categoryPass && textPass;
    });
  }, [category, data.feed, query]);

  const selectedItem = useMemo(
    () => filteredFeed.find((item) => item.id === selectedId) ?? data.feed.find((item) => item.id === selectedId) ?? null,
    [data.feed, filteredFeed, selectedId]
  );

  async function toggleLiked(item: FeedItem) {
    if (!viewer) return setMessage("Sign in to like posts.");
    try {
      await togglePostLike(item.id, viewer.id, Boolean(item.likedBy?.[viewer.id]));
      setMessage("");
    } catch {
      setMessage("Could not save your like. Check Firebase access.");
    }
  }

  async function toggleSaved(item: FeedItem) {
    if (!viewer) return setMessage("Sign in to save posts.");
    try {
      await togglePostSave(item.id, viewer.id, Boolean(item.savedBy?.[viewer.id]));
      setMessage("");
    } catch {
      setMessage("Could not save this post. Check Firebase access.");
    }
  }

  function DetailCard({ item }: { item: FeedItem }) {
    return (
      <LumiCard
        contentType={item.contentType}
        isFocusMode={isFocusMode}
        author={item.author.name}
        handle={item.author.username}
        avatarUrl={item.author.avatar}
        title={item.title}
        description={item.description}
        imageUrl={item.imageUrl}
        videoUrl={item.videoUrl}
        comments={item.comments}
        likes={item.likes}
        commentsCount={item.commentsCount}
        shares={item.shares}
        tags={item.tags}
        onLike={() => void toggleLiked(item)}
        onSave={() => void toggleSaved(item)}
        onComment={() => setSelectedId(item.id)}
        onOpenDetail={() => setSelectedId(item.id)}
        isLiked={Boolean(viewer && item.likedBy?.[viewer.id])}
        isSaved={Boolean(viewer && item.savedBy?.[viewer.id])}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className={`rounded-[24px] border p-5 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="mb-4">
          <p className={`text-2xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Explore</p>
          <p className={isFocusMode ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-white/60"}>
            Browse photos, reels, and threads with working interactions.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-full border px-4 py-3">
          <Search className={`h-4 w-4 ${isFocusMode ? "text-slate-400" : "text-white/40"}`} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators, captions, and tags"
            className={`w-full bg-transparent text-sm outline-none ${
              isFocusMode ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/35"
            }`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm ${
                category === item
                  ? "bg-lumi-purple text-white"
                  : isFocusMode
                    ? "bg-slate-100 text-slate-700"
                    : "bg-white/10 text-white/75"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {message ? <p role="status" className="text-sm text-rose-500">{message}</p> : null}

      {filteredFeed.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredFeed.map((item) => (
            <DetailCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className={`rounded-[24px] border p-8 text-center ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
          <p className={`text-lg font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>No posts yet</p>
          <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
            Try another search or create the first posts in Lumi.
          </p>
        </div>
      )}

      <AnimatePresence>
        {selectedItem ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className={`max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border p-4 ${
                isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={`text-lg font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{selectedItem.title}</p>
                  <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>{selectedItem.author.username}</p>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} className={isFocusMode ? "text-slate-500" : "text-white/60"}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <DetailCard item={selectedItem} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
