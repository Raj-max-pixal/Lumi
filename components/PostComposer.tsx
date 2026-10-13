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
  const [file, setFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [status, setStatus] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (selected && !(selected.type.startsWith("image/") || selected.type.startsWith("video/"))) {
      setStatus("Choose a photo or video file.");
      return;
    }
    if (selected && selected.size > (selected.type.startsWith("video/") ? 50 : 15) * 1024 * 1024) {
      setStatus("Photos must be under 15 MB and videos under 50 MB.");
      return;
    }
    setFile(selected);
    setStatus("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!viewer) {
      setStatus("Sign in first to post.");
      return;
    }

    if (!caption.trim() && !file) {
      setStatus("Add a photo, video, or caption before sharing.");
      return;
    }

    setIsPosting(true);
    setStatus("");

    try {
      let mediaUrl = "";
      const isVideo = Boolean(file?.type.startsWith("video/"));

      if (file) {
        const postAssetRef = storageRef(storage, `lumi-posts/${viewer.id}/${Date.now()}-${file.name}`);
        await uploadBytes(postAssetRef, file, { contentType: file.type });
        mediaUrl = await getDownloadURL(postAssetRef);
      }

      const postsRef = ref(realtimeDb, "community/posts");
      const nextPostRef = push(postsRef);

      await set(nextPostRef, {
        authorId: viewer.id,
        authorName: viewer.name,
        authorAvatar: viewer.avatar,
        caption: caption.trim(),
        imageUrl: isVideo ? "" : mediaUrl,
        videoUrl: isVideo ? mediaUrl : "",
        createdAt: Date.now(),
        likes: 0,
        commentsCount: 0,
        shares: 0,
        savedCount: 0,
        tags: isVideo ? ["Reel"] : mediaUrl ? ["Photo"] : ["Post"],
        likedBy: {},
        savedBy: {},
        comments: {}
      });

      await createNotification(viewer.id, "Post published", "Your post is now live on Lumi.");

      setCaption("");
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
          placeholder="Write a caption..."
          className={`min-h-28 w-full rounded-[18px] border p-4 text-sm outline-none ${
            isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/25 text-white"
          }`}
        />

        <div className="flex flex-wrap gap-4">
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm ${
              isFocusMode ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-black/25 text-white/80"
            }`}
          >
            <ImagePlus className="h-4 w-4" />
            {file ? file.name.slice(0, 28) : "Upload photo or reel"}
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p role="status" className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>{status || "Share a photo, video reel, or caption."}</p>
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
