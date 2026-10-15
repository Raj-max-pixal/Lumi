"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { onValue, push, ref, set } from "firebase/database";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { LumiViewer } from "@/components/AuthPanel";
import { auth, realtimeDb } from "@/lib/firebase";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { compressGalleryImage, isDisplayableImageSource, normalizeExternalImageUrl } from "@/lib/media";

type Story = { id: string; authorId: string; authorName: string; authorAvatar: string; mediaUrl: string; createdAt: number; expiresAt: number };

export default function StoriesRail({ viewer, isFocusMode = false }: { viewer: LumiViewer | null; isFocusMode?: boolean }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [galleryImage, setGalleryImage] = useState("");
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => onValue(ref(realtimeDb, "stories"), (snapshot: { val: () => unknown }) => {
    const value = snapshot.val() as Record<string, Omit<Story, "id">> | null;
    setStories(Object.entries(value ?? {}).map(([id, story]) => ({ id, ...story })).filter((story) => isDisplayableImageSource(story.mediaUrl) && story.expiresAt > Date.now()).sort((a, b) => b.createdAt - a.createdAt));
  }, () => setMessage("Stories are unavailable. Check the database connection.")), []);

  useEffect(() => {
    if (activeStoryIndex === null) return;
    const timer = window.setTimeout(() => setActiveStoryIndex((index) => index === null || index >= stories.length - 1 ? null : index + 1), 5000);
    return () => window.clearTimeout(timer);
  }, [activeStoryIndex, stories.length]);

  async function selectGalleryImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    try { setGalleryImage(await compressGalleryImage(file)); }
    catch (error) { setGalleryImage(""); setMessage(error instanceof Error ? error.message : "The image could not be prepared."); }
    event.target.value = "";
  }

  async function addStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer) return;
    if (auth.currentUser?.uid !== viewer.id) return setMessage("Your session changed. Sign in again before sharing.");
    const source = galleryImage || (mediaUrl.trim() ? normalizeExternalImageUrl(mediaUrl) : null);
    if (!source) return setMessage("Paste a secure image URL or choose an image from your gallery.");
    setSharing(true); setMessage("");
    try {
      const createdAt = Date.now();
      await set(push(ref(realtimeDb, "stories")), { authorId: viewer.id, authorName: viewer.name, authorAvatar: viewer.avatar, mediaUrl: source, createdAt, expiresAt: createdAt + 24 * 60 * 60 * 1000 });
      setMediaUrl(""); setGalleryImage(""); setMessage(galleryImage ? "Story shared from your gallery." : "Story shared from the direct image URL.");
    } catch (error) { setMessage(firebaseErrorMessage(error, "Sharing your story")); }
    finally { setSharing(false); }
  }

  const activeStory = activeStoryIndex === null ? null : stories[activeStoryIndex];
  const panel = isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950";
  return <>
    <section className={`rounded-[24px] border p-4 ${panel}`}>
      <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Stories</p>{stories.length ? <button type="button" onClick={() => setActiveStoryIndex(0)} className="text-sm text-lumi-purple">Watch all</button> : null}</div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        <button type="button" onClick={() => fileInput.current?.click()} disabled={!viewer || sharing} className={`min-w-[82px] ${viewer ? "" : "opacity-60"}`}><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]"><span className={`flex h-full w-full items-center justify-center rounded-full ${isFocusMode ? "bg-white" : "bg-zinc-950"}`}>{sharing ? <Loader2 className="h-5 w-5 animate-spin text-lumi-purple" /> : <Plus className="h-5 w-5 text-lumi-purple" />}</span></span><span className="mt-3 block text-center text-xs font-medium">Your story</span></button>
        {stories.map((story, index) => <button key={story.id} type="button" onClick={() => setActiveStoryIndex(index)} className="min-w-[82px]"><span className="mx-auto flex h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]"><span className="h-full w-full overflow-hidden rounded-full border-2 border-white"><img src={story.authorAvatar} alt={story.authorName} className="h-full w-full object-cover" /></span></span><span className="mt-3 block max-w-[82px] truncate text-center text-xs">{story.authorName}</span></button>)}
      </div>
      <form onSubmit={(event) => void addStory(event)} className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-2"><input type="url" maxLength={4096} aria-label="Story image URL" value={mediaUrl} onChange={(event) => { setMediaUrl(event.target.value); setGalleryImage(""); }} placeholder="Paste an image URL or Google Images link" className="min-w-0 flex-1 rounded-xl border border-current/15 bg-transparent px-3 py-2 text-sm" disabled={!viewer || sharing} /><button type="button" onClick={() => fileInput.current?.click()} disabled={!viewer || sharing} className="inline-flex items-center gap-2 rounded-xl border border-current/15 px-3 py-2 text-sm font-semibold disabled:opacity-50"><ImagePlus className="h-4 w-4" /> Gallery</button><button type="submit" disabled={!viewer || sharing} className="rounded-xl bg-lumi-purple px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Share story</button></div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => void selectGalleryImage(event)} />
        <p className="text-xs opacity-60">Google Images links are converted to their direct image URL. Gallery photos are compressed to a small image for the free database.</p>
        {galleryImage ? <div className="flex items-center gap-3"><img src={galleryImage} alt="Selected story preview" className="h-16 w-16 rounded-lg object-cover" /><button type="button" onClick={() => setGalleryImage("")} className="text-xs text-rose-500">Remove selected photo</button></div> : null}
      </form>
      {message ? <p role="status" className={`mt-3 text-sm ${message.startsWith("Story shared") ? "text-emerald-500" : "text-rose-500"}`}>{message}</p> : null}
      {!stories.length && !message ? <p className="mt-3 text-sm opacity-60">No stories yet. Share the first one.</p> : null}
    </section>
    <AnimatePresence>{activeStory ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setActiveStoryIndex(null)}><div className="relative aspect-[9/16] max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl bg-zinc-900" onClick={(event) => event.stopPropagation()}><img src={activeStory.mediaUrl} alt={`${activeStory.authorName}'s story`} className="h-full w-full object-contain" /><div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 text-white"><div className="mb-4 flex gap-1">{stories.map((story, index) => <span key={story.id} className={`h-1 flex-1 rounded-full ${index <= (activeStoryIndex ?? 0) ? "bg-white" : "bg-white/40"}`} />)}</div><div className="flex items-center justify-between"><Link href={`/profile/${activeStory.authorId}`} onClick={() => setActiveStoryIndex(null)} className="flex items-center gap-2 text-sm font-semibold"><img src={activeStory.authorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />{activeStory.authorName}</Link><button type="button" onClick={() => setActiveStoryIndex(null)} aria-label="Close story"><X className="h-5 w-5" /></button></div></div><div className="absolute inset-x-0 bottom-0 grid grid-cols-2 text-white"><button type="button" disabled={activeStoryIndex === 0} onClick={() => setActiveStoryIndex((index) => Math.max(0, (index ?? 0) - 1))} className="p-4 text-left disabled:opacity-40">Previous</button><button type="button" onClick={() => setActiveStoryIndex((index) => index === null || index >= stories.length - 1 ? null : index + 1)} className="p-4 text-right">Next</button></div></div></motion.div> : null}</AnimatePresence>
  </>;
}
