"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { onValue, push, ref, remove, set } from "firebase/database";
import { Bookmark, Filter, Heart, Loader2, MessageCircle, Search, Trash2, X } from "lucide-react";
import { realtimeDb } from "@/lib/firebase";
import LumiCard from "@/components/LumiCard";
import { LumiViewer } from "@/components/AuthPanel";
import { createNotification, togglePostLike, togglePostSave } from "@/lib/social-firebase";

type CommunityComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  body: string;
  createdAt: number;
};

type CommunityPost = {
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
  comments?: Record<string, Omit<CommunityComment, "id">>;
  likedBy?: Record<string, true>;
  savedBy?: Record<string, true>;
};

export default function CommunityFeed({
  viewer,
  isFocusMode = false
}: {
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    const postsRef = ref(realtimeDb, "community/posts");
    let resolved = false;
    const timeout = window.setTimeout(() => {
      if (!resolved) {
        setPosts([]);
        setIsLoading(false);
        setLoadMessage("Feed preview mode is active while Firebase loads.");
      }
    }, 10000);

    const unsubscribe = onValue(
      postsRef,
      (snapshot: { val: () => unknown }) => {
        resolved = true;
        const value = snapshot.val() as Record<string, Omit<CommunityPost, "id">> | null;

        if (!value) {
          setPosts([]);
          setIsLoading(false);
          return;
        }

        const nextPosts = Object.entries(value)
          .map(([id, payload]) => ({
            id, ...payload,
            likes: Object.keys(payload.likedBy ?? {}).length,
            commentsCount: Object.keys(payload.comments ?? {}).length,
            savedCount: Object.keys(payload.savedBy ?? {}).length
          }))
          .sort((a, b) => b.createdAt - a.createdAt);

        setPosts(nextPosts);
        setIsLoading(false);
        setLoadMessage("");
        console.log("Feed loaded");
      },
      () => {
        resolved = true;
        setPosts([]);
        setIsLoading(false);
        setLoadMessage("Could not load the feed from Firebase.");
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!viewer) {
      setFollowingIds([]);
      return;
    }

    const followingRef = ref(realtimeDb, `relationships/following/${viewer.id}`);
    const timeout = window.setTimeout(() => {
      setFollowingIds([]);
    }, 10000);

    const unsubscribe = onValue(
      followingRef,
      (snapshot: { val: () => unknown }) => {
        const value = snapshot.val() as Record<string, { createdAt: number }> | null;
        setFollowingIds(value ? Object.keys(value) : []);
      },
      () => {
        setFollowingIds([]);
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [viewer]);

  const visiblePosts = useMemo(() => {
    const feedBase =
      viewer && followingIds.length
        ? posts.filter((post) => post.authorId === viewer.id || followingIds.includes(post.authorId))
        : posts;

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return feedBase;
    }

    return feedBase.filter((post) => {
      const haystack = `${post.authorName} ${post.caption} ${(post.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [posts, query, viewer, followingIds]);

  const selectedPost = useMemo(
    () => visiblePosts.find((post) => post.id === selectedPostId) ?? null,
    [selectedPostId, visiblePosts]
  );

  async function likePost(post: CommunityPost) {
    if (!viewer) {
      return;
    }

    const alreadyLiked = Boolean(post.likedBy?.[viewer.id]);

    await togglePostLike(post.id, viewer.id, alreadyLiked);

    if (!alreadyLiked && post.authorId !== viewer.id) {
      await createNotification(post.authorId, "New like", `${viewer.name} liked your post.`);
    }
  }

  async function toggleSave(post: CommunityPost) {
    if (!viewer) {
      return;
    }

    const alreadySaved = Boolean(post.savedBy?.[viewer.id]);

    await togglePostSave(post.id, viewer.id, alreadySaved);
  }

  async function addComment(post: CommunityPost) {
    if (!viewer) {
      return;
    }

    const draft = commentDrafts[post.id]?.trim();
    if (!draft) {
      return;
    }

    const commentsRef = ref(realtimeDb, `community/posts/${post.id}/comments`);
    const nextCommentRef = push(commentsRef);
    await set(nextCommentRef, {
      authorId: viewer.id,
      authorName: viewer.name,
      authorHandle: `@${viewer.id.slice(0, 8)}`,
      body: draft,
      createdAt: Date.now()
    });

    setCommentDrafts((current) => ({ ...current, [post.id]: "" }));

    if (post.authorId !== viewer.id) {
      await createNotification(post.authorId, "New comment", `${viewer.name} commented on your post.`);
    }
  }

  async function deleteComment(post: CommunityPost, commentId: string) {
    const comment = post.comments?.[commentId];
    if (!viewer || !comment || comment.authorId !== viewer.id) {
      return;
    }

    await remove(ref(realtimeDb, `community/posts/${post.id}/comments/${commentId}`));
  }

  return (
    <section className="space-y-5">
      <div
        className={`rounded-[24px] border p-5 ${
          isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"
        }`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={`font-display text-xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Community feed</h2>
            <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>
              Recent posts from real Lumi accounts.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
            isFocusMode ? "bg-slate-100 text-slate-600" : "bg-lumi-purple/15 text-lumi-glow"
          }`}>
            <Filter className="h-3.5 w-3.5" />
            {visiblePosts.length} visible
          </div>
        </div>

        <div
          className={`flex items-center gap-3 rounded-full border px-4 py-3 ${
            isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/25"
          }`}
        >
          <Search className={`h-4 w-4 ${isFocusMode ? "text-slate-400" : "text-white/40"}`} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators, captions, or tags"
            className={`w-full bg-transparent text-sm outline-none ${
              isFocusMode ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/35"
            }`}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl">
          <Loader2 className="h-7 w-7 animate-spin text-lumi-purple" />
        </div>
      ) : visiblePosts.length ? (
        <div className="grid gap-6">
          {visiblePosts.map((post) => {
            const comments = Object.entries(post.comments ?? {})
              .map(([id, payload]) => ({ id, ...payload }))
              .sort((a, b) => a.createdAt - b.createdAt);

            const liked = viewer ? Boolean(post.likedBy?.[viewer.id]) : false;
            const saved = viewer ? Boolean(post.savedBy?.[viewer.id]) : false;

            return (
              <div key={post.id} className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href={`/profile/${post.authorId}`}
                    className={isFocusMode ? "text-sm font-medium text-slate-600 hover:text-slate-900" : "text-sm font-medium text-white/75 hover:text-white"}
                  >
                    View @{post.authorName}
                  </Link>
                  <div className={isFocusMode ? "text-xs text-slate-400" : "text-xs text-white/45"}>{new Date(post.createdAt).toLocaleDateString()}</div>
                </div>

                <LumiCard
                  contentType={post.videoUrl ? "video" : post.imageUrl ? "image" : "thread"}
                  isFocusMode={isFocusMode}
                  author={post.authorName}
                  handle={`@${post.authorId.slice(0, 8)}`}
                  avatarUrl={post.authorAvatar}
                  title={post.videoUrl ? "Reel" : post.imageUrl ? "Photo" : "Post"}
                  description={post.caption}
                  imageUrl={post.imageUrl}
                  videoUrl={post.videoUrl}
                  likes={post.likes}
                  commentsCount={post.commentsCount}
                  shares={post.shares}
                  tags={post.tags ?? ["Community", "Live"]}
                  onDoubleTap={() => {
                    if (!liked) {
                      void likePost(post);
                    }
                  }}
                  comments={comments.map((comment) => ({
                    id: comment.id,
                    author: comment.authorName,
                    handle: comment.authorHandle,
                    body: comment.body,
                    upvotes: 1
                  }))}
                />

                <div className={`rounded-[22px] border p-4 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void likePost(post)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                        liked ? "bg-lumi-purple text-white" : isFocusMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white/80"
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                      {liked ? "Liked" : "Like"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleSave(post)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                        saved ? "bg-lumi-purple text-white" : isFocusMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white/80"
                      }`}
                    >
                      <Bookmark className="h-4 w-4" />
                      {saved ? "Saved" : "Save"}
                    </button>
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                      isFocusMode ? "bg-slate-100 text-slate-600" : "bg-white/10 text-white/70"
                    }`}>
                      <MessageCircle className="h-4 w-4" />
                      {comments.length} comments
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPostId(post.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                        isFocusMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white/80"
                      }`}
                    >
                      Open post
                    </button>
                  </div>

                  <div className="mb-4 flex gap-3">
                    <input
                      value={commentDrafts[post.id] ?? ""}
                      onChange={(event) =>
                        setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                      }
                      placeholder="Add a comment..."
                      className={`w-full rounded-full border px-4 py-3 text-sm outline-none ${
                        isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/25 text-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => void addComment(post)}
                      className="rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white"
                    >
                      Comment
                    </button>
                  </div>

                  {comments.length ? (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`flex items-start justify-between gap-3 rounded-[24px] border p-3 ${
                            isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{comment.authorName}</p>
                            <p className={isFocusMode ? "text-sm text-slate-600" : "text-sm text-white/70"}>{comment.body}</p>
                          </div>
                          {viewer?.id === comment.authorId ? (
                            <button
                              type="button"
                              onClick={() => void deleteComment(post, comment.id)}
                              className={isFocusMode ? "text-slate-500 hover:text-slate-900" : "text-white/50 hover:text-white"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`rounded-[32px] border p-8 text-center ${
            isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
          }`}
        >
          <p className={`font-display text-xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>No community posts yet</p>
          <p className={isFocusMode ? "mt-3 text-sm text-slate-500" : "mt-3 text-sm text-white/60"}>
            {loadMessage || "Publish the first post from the composer to populate the shared feed."}
          </p>
        </div>
      )}

      <AnimatePresence>
        {selectedPost ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setSelectedPostId(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className={`max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[28px] border ${
                isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950 text-white"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between border-b px-5 py-4 ${isFocusMode ? "border-slate-200" : "border-white/10"}`}>
                <div>
                  <p className={`text-lg font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Post details</p>
                  <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>@{selectedPost.authorId.slice(0, 8)}</p>
                </div>
                <button type="button" onClick={() => setSelectedPostId(null)} className={isFocusMode ? "text-slate-500" : "text-white/60"}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid max-h-[calc(90vh-73px)] overflow-hidden md:grid-cols-[1.1fr_0.9fr]">
                <div className={`relative min-h-[320px] ${selectedPost.imageUrl || selectedPost.videoUrl ? "" : isFocusMode ? "bg-slate-50" : "bg-black/20"}`}>
                  {selectedPost.imageUrl || selectedPost.videoUrl ? (
                    <LumiCard
                      contentType={selectedPost.videoUrl ? "video" : "image"}
                      isFocusMode={isFocusMode}
                      author={selectedPost.authorName}
                      handle={`@${selectedPost.authorId.slice(0, 8)}`}
                      avatarUrl={selectedPost.authorAvatar}
                      description={selectedPost.caption}
                      imageUrl={selectedPost.imageUrl}
                      videoUrl={selectedPost.videoUrl}
                      likes={selectedPost.likes}
                      commentsCount={selectedPost.commentsCount}
                      shares={selectedPost.shares}
                    />
                  ) : (
                    <div className="p-6">
                      <LumiCard
                        contentType="thread"
                        isFocusMode={isFocusMode}
                        author={selectedPost.authorName}
                        handle={`@${selectedPost.authorId.slice(0, 8)}`}
                        avatarUrl={selectedPost.authorAvatar}
                        title="Thread"
                        description={selectedPost.caption}
                        likes={selectedPost.likes}
                        commentsCount={selectedPost.commentsCount}
                        shares={selectedPost.shares}
                      />
                    </div>
                  )}
                </div>

                <div className="flex min-h-0 flex-col">
                  <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                    {Object.entries(selectedPost.comments ?? {})
                      .map(([id, payload]) => ({ id, ...payload }))
                      .sort((a, b) => a.createdAt - b.createdAt)
                      .map((comment) => (
                        <div
                          key={comment.id}
                          className={`rounded-[18px] border p-3 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}
                        >
                          <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{comment.authorName}</p>
                          <p className={isFocusMode ? "mt-1 text-sm text-slate-600" : "mt-1 text-sm text-white/70"}>{comment.body}</p>
                        </div>
                      ))}
                  </div>
                  <div className={`border-t px-5 py-4 ${isFocusMode ? "border-slate-200" : "border-white/10"}`}>
                    <div className="flex gap-3">
                      <input
                        value={commentDrafts[selectedPost.id] ?? ""}
                        onChange={(event) =>
                          setCommentDrafts((current) => ({ ...current, [selectedPost.id]: event.target.value }))
                        }
                        placeholder="Add a comment..."
                        className={`w-full rounded-full border px-4 py-3 text-sm outline-none ${
                          isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/25 text-white"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => void addComment(selectedPost)}
                        className="rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
