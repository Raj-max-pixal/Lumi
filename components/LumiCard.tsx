"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Play, Send } from "lucide-react";
import { useState } from "react";
import { FeedComment } from "@/lib/social";

type LumiCardProps = {
  contentType: "video" | "image" | "thread";
  isFocusMode?: boolean;
  author?: string;
  handle?: string;
  avatarUrl?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  comments?: FeedComment[];
  likes?: number;
  commentsCount?: number;
  shares?: number;
  tags?: string[];
  onDoubleTap?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onOpenDetail?: () => void;
  isLiked?: boolean;
  isSaved?: boolean;
};

function NestedComments({ nodes, isFocusMode = false, depth = 0 }: { nodes: FeedComment[]; isFocusMode?: boolean; depth?: number }) {
  return (
    <div className="space-y-4">
      {nodes.map((comment) => (
        <div
          key={comment.id}
          className={`relative rounded-[18px] border p-4 ${
            isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
          }`}
          style={{ marginLeft: depth ? depth * 14 : 0 }}
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              {comment.avatar ? (
                <div className="relative h-9 w-9 overflow-hidden rounded-full">
                  <Image src={comment.avatar} alt={comment.author} fill className="object-cover" />
                </div>
              ) : null}
              <div>
                <span className={isFocusMode ? "font-semibold text-slate-900" : "font-semibold text-white"}>{comment.author}</span>
                <span className={isFocusMode ? "ml-2 text-slate-400" : "ml-2 text-white/45"}>{comment.handle}</span>
              </div>
            </div>
            <span className={isFocusMode ? "text-xs text-slate-400" : "text-xs text-white/40"}>{comment.upvotes} likes</span>
          </div>
          <p className={isFocusMode ? "text-sm leading-6 text-slate-700" : "text-sm leading-6 text-white/75"}>{comment.body}</p>
          {comment.children?.length ? (
            <div className="mt-4 border-l border-white/10 pl-4">
              <NestedComments nodes={comment.children} depth={depth + 1} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function LumiCard({
  contentType,
  isFocusMode = false,
  author = "Lumi User",
  handle = "@lumi",
  avatarUrl = "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile",
  title = "Post",
  description = "",
  imageUrl = "",
  videoUrl = "",
  comments = [],
  likes = 0,
  commentsCount = 0,
  shares = 0,
  onDoubleTap,
  onLike,
  onComment,
  onShare,
  onSave,
  onOpenDetail,
  isLiked = false,
  isSaved = false
}: LumiCardProps) {
  const baseClass = isFocusMode ? "border-slate-200 bg-white text-slate-900" : "border-white/10 bg-zinc-950 text-white";
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  function triggerHeartBurst() {
    setShowHeartBurst(true);
    onDoubleTap?.();
    window.setTimeout(() => setShowHeartBurst(false), 700);
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`overflow-hidden rounded-[24px] border ${baseClass}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image src={avatarUrl} alt={author} fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">{author}</p>
              <p className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/55"}>{handle}</p>
            </div>
          </div>
          {onOpenDetail ? <button type="button" onClick={onOpenDetail} aria-label="Open post details" className={isFocusMode ? "text-slate-400" : "text-white/60"}><MoreHorizontal className="h-5 w-5" /></button> : null}
        </div>
      </div>

      {contentType === "video" ? (
        <div className="relative aspect-[4/5] overflow-hidden border-y border-current/10">
          <video className="h-full w-full bg-black object-contain" src={videoUrl} controls playsInline preload="metadata" aria-label={title} />
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
            <Play className="h-3.5 w-3.5 fill-current" />
            Reel
          </div>
        </div>
      ) : null}

      {contentType === "image" ? (
        <div className="relative aspect-[4/5] overflow-hidden border-y border-current/10" onDoubleClick={triggerHeartBurst}>
          <Image src={imageUrl} alt={title} fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
          {showHeartBurst ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="rounded-full bg-black/20 p-6 backdrop-blur-sm">
                <Heart className="h-16 w-16 fill-white text-white" />
              </div>
            </motion.div>
          ) : null}
          {onOpenDetail ? <button type="button" onClick={onOpenDetail} className="absolute inset-0" aria-label="Open post details" /> : null}
        </div>
      ) : null}

      {contentType === "thread" ? (
        <button type="button" onClick={onOpenDetail} className="block w-full p-4 text-left">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className={isFocusMode ? "mt-2 text-sm leading-6 text-slate-700" : "mt-2 text-sm leading-6 text-white/78"}>{description}</p>
          {comments.length ? <div className="mt-4"><NestedComments nodes={comments} isFocusMode={isFocusMode} /></div> : null}
        </button>
      ) : null}

      <div className={`px-4 py-3 ${isFocusMode ? "text-slate-500" : "text-white/60"}`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onLike ? <button type="button" onClick={onLike} aria-label="Like post" className="transition hover:scale-110">
              <Heart className={`h-5 w-5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
            </button> : null}
            {onComment || onOpenDetail ? <button type="button" onClick={onComment ?? onOpenDetail} aria-label="View comments" className="transition hover:scale-110">
              <MessageCircle className="h-5 w-5" />
            </button> : null}
            {onShare ? <button type="button" onClick={onShare} aria-label="Share post" className="transition hover:scale-110">
              <Send className="h-5 w-5" />
            </button> : null}
          </div>
          {onSave ? <button type="button" onClick={onSave} aria-label="Save post" className="transition hover:scale-110">
            <Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
          </button> : null}
        </div>

        <div className={`space-y-1 text-sm ${isFocusMode ? "text-slate-900" : "text-white"}`}>
          <p className="font-semibold">{likes.toLocaleString()} likes</p>
          <p>
            <span className="mr-2 font-semibold">{handle}</span>
            <span className={isFocusMode ? "text-slate-700" : "text-white/80"}>{description}</span>
          </p>
          {onComment || onOpenDetail ? <button type="button" onClick={onComment ?? onOpenDetail} className={isFocusMode ? "text-slate-500" : "text-white/55"}>View all {commentsCount} comments</button> : null}
        </div>
      </div>
    </motion.article>
  );
}
