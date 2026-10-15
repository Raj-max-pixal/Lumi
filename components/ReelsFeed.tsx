"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DiscoverPayload } from "@/lib/social";
import LumiCard from "@/components/LumiCard";
import { LumiViewer } from "@/components/AuthPanel";
import { togglePostLike, togglePostSave } from "@/lib/social-firebase";
import { DEVELOPER_TOPICS, reelInterestScore, topicForInterest } from "@/lib/developer-topics";
import { ExternalReelsResponse } from "@/lib/external-reels";

export default function ReelsFeed({
  feed,
  viewer,
  interests,
  loadError = "",
  loading = false,
  onRetry,
  isFocusMode = false
}: {
  feed: DiscoverPayload["feed"];
  viewer: LumiViewer | null;
  interests: string[];
  loadError?: string;
  loading?: boolean;
  onRetry?: () => void;
  isFocusMode?: boolean;
}) {
  const [view, setView] = useState<"for-you" | "all">("for-you");
  const [source, setSource] = useState<"lumi" | "youtube">("youtube");
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const preferredTopics = useMemo(() => [...new Set(interests.map(topicForInterest).filter(Boolean))], [interests]);
  const youtubeTopic = topic || (view === "for-you" ? preferredTopics[0] : "") || "Web Development";
  const [youtube, setYoutube] = useState<ExternalReelsResponse | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  useEffect(() => {
    if (source !== "youtube") return;
    const controller = new AbortController();
    setYoutubeLoading(true);
    setYoutube(null);
    fetch(`/api/reels/youtube?topic=${encodeURIComponent(youtubeTopic)}`, { signal: controller.signal })
      .then(async (response) => await response.json() as ExternalReelsResponse)
      .then(setYoutube)
      .catch(() => { if (!controller.signal.aborted) setYoutube({ items: [], configured: true, error: "YouTube videos could not load." }); })
      .finally(() => { if (!controller.signal.aborted) setYoutubeLoading(false); });
    return () => controller.abort();
  }, [source, youtubeTopic]);
  const reels = useMemo(() => feed.filter((item) => item.contentType === "video" && Boolean(item.videoUrl))
    .filter((item) => !topic || reelInterestScore(item, [topic]) > 0)
    .filter((item) => view === "all" || Boolean(topic) || !preferredTopics.length || reelInterestScore(item, interests) > 0)
    .sort((a, b) => view === "for-you" ? reelInterestScore(b, interests) - reelInterestScore(a, interests) || (b.createdAt ?? 0) - (a.createdAt ?? 0) : (b.createdAt ?? 0) - (a.createdAt ?? 0)), [feed, interests, preferredTopics.length, topic, view]);

  async function updateReaction(action: "like" | "save", id: string, active: boolean) {
    if (!viewer) { setStatus("Sign in to interact with reels."); return; }
    try {
      if (action === "like") await togglePostLike(id, viewer.id, active);
      else await togglePostSave(id, viewer.id, active);
      setStatus("");
    } catch { setStatus("Could not save your choice. Please retry."); }
  }

  return (
    <div className="space-y-4">
      <section className={`rounded-[24px] border p-5 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <p className={`text-2xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Developer reels</p>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>Short lessons, project demos, and ideas from student builders.</p>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Reel source">
          <button type="button" onClick={() => setSource("youtube")} className={`rounded-full px-4 py-2 text-sm ${source === "youtube" ? "bg-lumi-purple text-white" : "border border-current/15"}`}>YouTube lessons</button>
          <button type="button" onClick={() => setSource("lumi")} className={`rounded-full px-4 py-2 text-sm ${source === "lumi" ? "bg-lumi-purple text-white" : "border border-current/15"}`}>Lumi Originals</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setView("for-you")} className={`rounded-full px-4 py-2 text-sm ${view === "for-you" ? "bg-lumi-purple text-white" : "border border-current/15"}`}>For you</button><button type="button" onClick={() => setView("all")} className={`rounded-full px-4 py-2 text-sm ${view === "all" ? "bg-lumi-purple text-white" : "border border-current/15"}`}>Explore all</button></div>
        <label className="mt-4 block text-xs font-medium">Topic
          <select aria-label="Filter reels by developer topic" value={topic} onChange={(event) => setTopic(event.target.value)} className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${isFocusMode ? "border-slate-200 bg-white text-slate-900" : "border-white/15 bg-[#17131e] text-white"}`}><option value="">All developer topics</option>{DEVELOPER_TOPICS.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        {view === "for-you" && <p className="mt-3 text-xs opacity-65">{preferredTopics.length ? `Based on your interests: ${preferredTopics.join(" · ")}` : <>Add interests in your <Link href="/profile" className="underline">profile</Link> to personalize this feed.</>}</p>}
        {status && <p role="status" className="mt-2 text-xs text-rose-400">{status}</p>}
      </section>

      <div className="h-[78vh] snap-y snap-mandatory space-y-4 overflow-y-auto pr-1">
        {source === "youtube" && <>
          <p className="text-xs opacity-65">Short videos about {youtubeTopic}, played from their creators on YouTube. These may include Shorts and other videos under four minutes.</p>
          {youtubeLoading && <p role="status" className="rounded-2xl border border-current/10 p-5 text-sm">Finding developer videos…</p>}
          {youtube?.items.map((item) => <article key={item.id} className={`snap-start overflow-hidden rounded-[24px] border ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
            <div className="p-4"><span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-500">YouTube</span><h3 className="mt-3 font-semibold">{item.title}</h3><p className="mt-1 text-xs opacity-65">{item.creator}</p></div>
            <iframe title={item.title} src={`https://www.youtube-nocookie.com/embed/${item.videoId}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="aspect-video w-full bg-black" referrerPolicy="strict-origin-when-cross-origin" />
            <div className="p-4"><p className="line-clamp-3 text-sm opacity-75">{item.description}</p><a href={`https://www.youtube.com/watch?v=${item.videoId}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-lumi-purple underline">Watch on YouTube ↗</a></div>
          </article>)}
          {youtube?.error && <p role="alert" className="rounded-2xl border border-rose-500/30 p-5 text-sm">{youtube.error}</p>}
          {youtube && !youtube.configured && <div className="rounded-2xl border border-current/10 p-6 text-sm"><p className="font-semibold">Curated YouTube picks</p><p className="mt-2 opacity-65">These are selected developer lessons. Automatic discovery of new videos starts when the site owner configures a YouTube Data API key.</p></div>}
          {youtube?.configured && !youtube.error && !youtube.items.length && <p className="rounded-2xl border border-current/10 p-5 text-sm">No embeddable videos found for this topic right now.</p>}
        </>}
        {source === "lumi" && loading && <p role="status" className="rounded-2xl border border-current/10 p-5 text-sm">Loading Lumi Originals…</p>}
        {source === "lumi" && loadError && <div role="alert" className="rounded-2xl border border-rose-500/30 p-5 text-sm"><p>{loadError} Check the Lumi database connection.</p>{onRetry && <button type="button" onClick={onRetry} className="mt-2 font-semibold text-lumi-purple underline">Retry loading</button>}</div>}
        {source === "lumi" && reels.map((item) => (
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
              onLike={() => void updateReaction("like", item.id, Boolean(viewer && item.likedBy?.[viewer.id]))}
              onSave={() => void updateReaction("save", item.id, Boolean(viewer && item.savedBy?.[viewer.id]))}
              isLiked={Boolean(viewer && item.likedBy?.[viewer.id])}
              isSaved={Boolean(viewer && item.savedBy?.[viewer.id])}
            />
          </div>
        ))}
        {source === "lumi" && !reels.length && !loadError && !loading ? <div className="rounded-[24px] border border-current/10 p-8 text-center text-sm"><p>{topic ? `No ${topic} reels yet.` : view === "for-you" && preferredTopics.length ? "No reels match your interests yet." : "No developer reels yet."}</p><p className="mt-2 opacity-65">{view === "for-you" && preferredTopics.length ? "Explore all topics or share a reel about what you are building." : "Share a short project demo or tutorial to start the feed."}</p>{view === "for-you" && preferredTopics.length && <button type="button" onClick={() => setView("all")} className="mt-3 rounded-full bg-lumi-purple px-4 py-2 font-semibold text-white">Explore all reels</button>}</div> : null}
      </div>
    </div>
  );
}
