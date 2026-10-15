"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { onValue, push, ref, set } from "firebase/database";
import { Loader2, Plus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { LumiViewer } from "@/components/AuthPanel";
import { auth, realtimeDb } from "@/lib/firebase";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { isSafeUrl } from "@/lib/hackathon";

type Story = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  createdAt: number;
  expiresAt: number;
};

export default function StoriesRail({ viewer, isFocusMode = false }: { viewer: LumiViewer | null; isFocusMode?: boolean }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onValue(ref(realtimeDb, "stories"), (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, Omit<Story, "id">> | null;
      setStories(Object.entries(value ?? {})
        .map(([id, story]) => ({ id, ...story }))
        .filter((story) => story.mediaUrl && story.expiresAt > Date.now())
        .sort((a, b) => b.createdAt - a.createdAt));
      setMessage("");
    }, () => setMessage("Stories are unavailable. Check the database connection."));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeStoryIndex === null) return;
    const timer = window.setTimeout(() => setActiveStoryIndex((index) =>
      index === null || index >= stories.length - 1 ? null : index + 1), 5000);
    return () => window.clearTimeout(timer);
  }, [activeStoryIndex, stories.length]);

  async function addStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer) return;
    if (auth.currentUser?.uid !== viewer.id) { setMessage("Your session changed. Sign in again before sharing."); return; }
    if (!isSafeUrl(mediaUrl.trim())) { setMessage("Use an HTTPS image URL for your story."); return; }
    setSharing(true);
    setMessage("");
    try {
      const createdAt = Date.now();
      await set(push(ref(realtimeDb, "stories")), {
        authorId: viewer.id, authorName: viewer.name, authorAvatar: viewer.avatar,
        mediaUrl: mediaUrl.trim(), createdAt, expiresAt: createdAt + 24 * 60 * 60 * 1000
      });
      setMediaUrl(""); setMessage("Story shared from your image URL. No file was uploaded.");
    } catch (error) {
      setMessage(firebaseErrorMessage(error, "Sharing your story"));
    } finally {
      setSharing(false);
    }
  }

  const activeStory = activeStoryIndex === null ? null : stories[activeStoryIndex];
  return (
    <>
      <section className={`rounded-[24px] border p-4 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Stories</p>
          {stories.length ? <button type="button" onClick={() => setActiveStoryIndex(0)} className="text-sm text-lumi-purple">Watch all</button> : null}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          <div className={`min-w-[82px] ${viewer ? "" : "opacity-60"}`}>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              <span className={`flex h-full w-full items-center justify-center rounded-full ${isFocusMode ? "bg-white" : "bg-zinc-950"}`}>
                {sharing ? <Loader2 className="h-5 w-5 animate-spin text-lumi-purple" /> : <Plus className="h-5 w-5 text-lumi-purple" />}
              </span>
            </span>
            <span className="mt-3 block text-center text-xs font-medium">Your story</span>
          </div>
          {stories.map((story, index) => (
            <button key={story.id} type="button" onClick={() => setActiveStoryIndex(index)} className="min-w-[82px]">
              <span className="mx-auto flex h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                <span className="relative h-full w-full overflow-hidden rounded-full border-2 border-white">
                  <Image src={story.authorAvatar} alt={story.authorName} fill unoptimized sizes="64px" className="object-cover" />
                </span>
              </span>
              <span className="mt-3 block max-w-[82px] truncate text-center text-xs">{story.authorName}</span>
            </button>
          ))}
        </div>
        <form onSubmit={(event) => void addStory(event)} className="mt-3 flex flex-wrap gap-2"><input type="url" maxLength={2048} aria-label="Story image URL" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://your-site.com/story.jpg" className="min-w-0 flex-1 rounded-xl border border-current/15 bg-transparent px-3 py-2 text-sm" disabled={!viewer || sharing} /><button type="submit" disabled={!viewer || sharing} className="rounded-xl bg-lumi-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Share story</button></form>
        <p className="mt-1 text-xs opacity-60">Direct uploads are unavailable. Link an image you host elsewhere.</p>
        {message ? <p role="status" className="mt-3 text-sm text-rose-500">{message}</p> : null}
        {!stories.length && !message ? <p className="mt-3 text-sm opacity-60">No stories yet. Share the first one.</p> : null}
      </section>
      <AnimatePresence>
        {activeStory ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setActiveStoryIndex(null)}>
            <div className="relative aspect-[9/16] max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900" onClick={(event) => event.stopPropagation()}>
              {isSafeUrl(activeStory.mediaUrl) && <Image src={activeStory.mediaUrl} alt={`${activeStory.authorName}'s story`} fill unoptimized sizes="(max-width: 640px) 100vw, 390px" className="object-contain" />}
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
                <div className="mb-4 flex gap-1">{stories.map((story, index) => <span key={story.id} className={`h-1 flex-1 rounded-full ${index <= activeStoryIndex! ? "bg-white" : "bg-white/40"}`} />)}</div>
                <div className="flex items-center justify-between">
                  <Link href={`/profile/${activeStory.authorId}`} onClick={() => setActiveStoryIndex(null)} className="flex items-center gap-2 text-sm font-semibold">
                    <span className="relative h-8 w-8 overflow-hidden rounded-full"><Image src={activeStory.authorAvatar} alt="" fill unoptimized sizes="32px" className="object-cover" /></span>
                    {activeStory.authorName}
                  </Link>
                  <button type="button" onClick={() => setActiveStoryIndex(null)} aria-label="Close story"><X className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 text-white">
                <button type="button" disabled={activeStoryIndex === 0} onClick={() => setActiveStoryIndex((index) => Math.max(0, (index ?? 0) - 1))} className="p-4 text-left disabled:opacity-40">Previous</button>
                <button type="button" onClick={() => setActiveStoryIndex((index) => index === null || index >= stories.length - 1 ? null : index + 1)} className="p-4 text-right">Next</button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
