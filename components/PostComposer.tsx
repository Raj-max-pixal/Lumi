"use client";

import { FormEvent, useState } from "react";
import { push, ref, set } from "firebase/database";
import { Loader2, Send } from "lucide-react";
import { auth, realtimeDb } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";
import { createNotification } from "@/lib/social-firebase";
import { DEVELOPER_TOPICS } from "@/lib/developer-topics";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { youtubeVideoId } from "@/lib/hackathon";
import { normalizeExternalImageUrl } from "@/lib/media";

export default function PostComposer({ viewer, isFocusMode = false }: { viewer: LumiViewer | null; isFocusMode?: boolean }) {
  const [caption, setCaption] = useState("");
  const [topic, setTopic] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [status, setStatus] = useState("");
  const field = `w-full rounded-[18px] border px-4 py-3 text-sm outline-none ${isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/25 text-white"}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPosting) return;
    if (!viewer) { setStatus("Sign in first to post."); return; }
    if (auth.currentUser?.uid !== viewer.id) { setStatus("Your session changed. Sign in again before posting."); return; }
    if (!caption.trim() && !imageUrl.trim() && !videoUrl.trim()) { setStatus("Add a caption or a media link before sharing."); return; }
    if (!topic) { setStatus("Choose the developer topic this post teaches or explores."); return; }
    if (imageUrl.trim() && videoUrl.trim()) { setStatus("Use one image or YouTube link per post."); return; }
    const normalizedImageUrl = imageUrl.trim() ? normalizeExternalImageUrl(imageUrl) : "";
    if ((imageUrl.trim() && !normalizedImageUrl) || (videoUrl.trim() && !youtubeVideoId(videoUrl.trim()))) { setStatus("Use an HTTPS image URL or a supported public YouTube video URL."); return; }
    if (videoUrl.trim() && !caption.trim()) { setStatus("Add a caption explaining what students will learn from this clip."); return; }

    setIsPosting(true); setStatus("");
    try {
      await set(push(ref(realtimeDb, "community/posts")), {
        authorId: viewer.id, authorName: viewer.name, authorAvatar: viewer.avatar,
        caption: caption.trim(), imageUrl: normalizedImageUrl, videoUrl: videoUrl.trim(),
        createdAt: Date.now(), likes: 0, commentsCount: 0, shares: 0, savedCount: 0,
        tags: [topic], likedBy: {}, savedBy: {}, comments: {}
      });
      try { await createNotification(viewer.id, "Post published", "Your post is now live on Lumi."); }
      catch { /* A notification failure does not undo a published post. */ }
      setCaption(""); setTopic(""); setImageUrl(""); setVideoUrl("");
      setStatus("Shared. Lumi saved your links; no files were uploaded.");
    } catch (error) { setStatus(firebaseErrorMessage(error, "Publishing your post")); }
    finally { setIsPosting(false); }
  }

  return <section className={`rounded-[24px] border p-4 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea maxLength={5000} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Share what you built, learned, or want to teach other developers..." className={`min-h-28 ${field}`} />
      <label className="block text-sm font-medium">Developer topic<select required value={topic} onChange={(event) => setTopic(event.target.value)} className={`mt-2 ${field}`}><option value="">Choose a topic</option>{DEVELOPER_TOPICS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Image URL (optional)<input type="url" maxLength={5000} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://your-site.com/image.png" className={`mt-2 ${field}`} /></label>
        <label className="text-sm font-medium">YouTube video or Short URL (optional)<input type="url" maxLength={2048} value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://youtube.com/shorts/..." className={`mt-2 ${field}`} /></label>
      </div>
      <p className="text-xs opacity-65">Direct photo and video uploads are unavailable. Link media already hosted by you; videos stay on YouTube.</p>
      <div className="flex items-center justify-between gap-4"><p role="status" className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>{status || "Share a project update, tutorial, or dev clip."}</p><button type="submit" disabled={isPosting} className="inline-flex items-center gap-2 rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-70">{isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Share</button></div>
    </form>
  </section>;
}
