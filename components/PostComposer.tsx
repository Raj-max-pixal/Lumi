"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { push, ref, set } from "firebase/database";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { realtimeDb, storage } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";
import { createNotification } from "@/lib/social-firebase";

export default function PostComposer({
  viewer,
  isFocusMode = false
}: {
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [status, setStatus] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!viewer) {
      setStatus("Sign in first to post.");
      return;
    }

    if (!caption.trim()) {
      setStatus("Write something before sharing.");
      return;
    }

    setIsPosting(true);
    setStatus("");

    try {
      let finalImageUrl = imageUrl.trim();

      if (file) {
        const postAssetRef = storageRef(storage, `lumi-posts/${viewer.id}/${Date.now()}-${file.name}`);
        await uploadBytes(postAssetRef, file);
        finalImageUrl = await getDownloadURL(postAssetRef);
      }

      const postsRef = ref(realtimeDb, "community/posts");
      const nextPostRef = push(postsRef);

      await set(nextPostRef, {
        authorId: viewer.id,
        authorName: viewer.name,
        authorAvatar: viewer.avatar,
        caption: caption.trim(),
        imageUrl: finalImageUrl || "",
        createdAt: Date.now(),
        likes: 0,
        commentsCount: 0,
        shares: 0,
        savedCount: 0,
        tags: finalImageUrl ? ["Photo"] : ["Post"],
        likedBy: {},
        savedBy: {},
        comments: {}
      });

      await createNotification(viewer.id, "Post published", "Your post is now live on Lumi.");

      setCaption("");
      setImageUrl("");
      setFile(null);
      setStatus("Shared.");
    } catch {
      setStatus("Unable to share right now. Check Firebase Database and Storage rules.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <section className={`rounded-[24px] border p-4 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Share something with your followers..."
          className={`min-h-28 w-full rounded-[18px] border p-4 text-sm outline-none ${
            isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/25 text-white"
          }`}
        />

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Paste an image URL"
            className={`rounded-full border px-4 py-3 text-sm outline-none ${
              isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/25 text-white"
            }`}
          />
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm ${
              isFocusMode ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-black/25 text-white/80"
            }`}
          >
            <ImagePlus className="h-4 w-4" />
            {file ? file.name.slice(0, 18) : "Upload image"}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>{status || "Photo, caption, and quick share."}</p>
          <button
            type="submit"
            disabled={isPosting}
            className="inline-flex items-center gap-2 rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-70"
          >
            {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Share
          </button>
        </div>
      </form>
    </section>
  );
}
