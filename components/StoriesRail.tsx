"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { onValue, push, ref, set } from "firebase/database";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { Loader2, Plus, X } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { LumiViewer } from "@/components/AuthPanel";
import { auth, realtimeDb, storage } from "@/lib/firebase";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { uploadFileName, uploadValidationError } from "@/lib/uploads";

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
  const [uploading, setUploading] = useState(false);
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

  async function addStory(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!viewer) return;
    if (!file) return;
    if (auth.currentUser?.uid !== viewer.id) { setMessage("Your session changed. Sign in again before sharing."); return; }
    const validation = uploadValidationError(file, "story");
    if (validation) { setMessage(validation); return; }
    setUploading(true);
    setMessage("");
    try {
      const asset = storageRef(storage, `stories/${viewer.id}/${uploadFileName(file)}`);
      await uploadBytes(asset, file, { contentType: file.type });
      const mediaUrl = await getDownloadURL(asset);
      const createdAt = Date.now();
      await set(push(ref(realtimeDb, "stories")), {
        authorId: viewer.id, authorName: viewer.name, authorAvatar: viewer.avatar,
        mediaUrl, createdAt, expiresAt: createdAt + 24 * 60 * 60 * 1000
      });
    } catch (error) {
      setMessage(firebaseErrorMessage(error, "Sharing your story"));
    } finally {
      setUploading(false);
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
          <label className={`min-w-[82px] ${viewer ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              <span className={`flex h-full w-full items-center justify-center rounded-full ${isFocusMode ? "bg-white" : "bg-zinc-950"}`}>
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-lumi-purple" /> : <Plus className="h-5 w-5 text-lumi-purple" />}
              </span>
            </span>
            <span className="mt-3 block text-center text-xs font-medium">Your story</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!viewer || uploading} onChange={(event) => void addStory(event)} className="hidden" />
          </label>
          {stories.map((story, index) => (
            <button key={story.id} type="button" onClick={() => setActiveStoryIndex(index)} className="min-w-[82px]">
              <span className="mx-auto flex h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                <span className="relative h-full w-full overflow-hidden rounded-full border-2 border-white">
                  <Image src={story.authorAvatar} alt={story.authorName} fill sizes="64px" className="object-cover" />
                </span>
              </span>
              <span className="mt-3 block max-w-[82px] truncate text-center text-xs">{story.authorName}</span>
            </button>
          ))}
        </div>
        {message ? <p role="status" className="mt-3 text-sm text-rose-500">{message}</p> : null}
        {!stories.length && !message ? <p className="mt-3 text-sm opacity-60">No stories yet. Share the first one.</p> : null}
      </section>
      <AnimatePresence>
        {activeStory ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setActiveStoryIndex(null)}>
            <div className="relative aspect-[9/16] max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900" onClick={(event) => event.stopPropagation()}>
              <Image src={activeStory.mediaUrl} alt={`${activeStory.authorName}'s story`} fill sizes="(max-width: 640px) 100vw, 390px" className="object-contain" />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
                <div className="mb-4 flex gap-1">{stories.map((story, index) => <span key={story.id} className={`h-1 flex-1 rounded-full ${index <= activeStoryIndex! ? "bg-white" : "bg-white/40"}`} />)}</div>
                <div className="flex items-center justify-between">
                  <Link href={`/profile/${activeStory.authorId}`} onClick={() => setActiveStoryIndex(null)} className="flex items-center gap-2 text-sm font-semibold">
                    <span className="relative h-8 w-8 overflow-hidden rounded-full"><Image src={activeStory.authorAvatar} alt="" fill sizes="32px" className="object-cover" /></span>
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
