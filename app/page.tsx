"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { limitToLast, onValue, orderByChild, query, ref } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import CommunityFeed from "@/components/CommunityFeed";
import { useLumiMode } from "@/components/LumiModeContext";
import NotificationsPanel from "@/components/NotificationsPanel";
import PostComposer from "@/components/PostComposer";
import RightRail from "@/components/RightRail";
import StoriesRail from "@/components/StoriesRail";
import { auth, realtimeDb } from "@/lib/firebase";
import { buildDiscoverPayloadFromRealtime, DiscoverPayload, RealtimePostRecord, RealtimeProfileRecord } from "@/lib/social";

const AIHub = dynamic(() => import("@/components/AIHub"));
const ChatWindow = dynamic(() => import("@/components/ChatWindow"));
const CommunitiesPanel = dynamic(() => import("@/components/CommunitiesPanel"));
const CreatorAnalyticsPanel = dynamic(() => import("@/components/CreatorAnalyticsPanel"));
const ExplorePanel = dynamic(() => import("@/components/ExplorePanel"));
const MagicWritePanel = dynamic(() => import("@/components/MagicWritePanel"));
const ProfileIdentityPanel = dynamic(() => import("@/components/ProfileIdentityPanel"));
const ProfileScreen = dynamic(() => import("@/components/ProfileScreen"));
const ReelsFeed = dynamic(() => import("@/components/ReelsFeed"));
const UserSettingsPanel = dynamic(() => import("@/components/UserSettingsPanel"));

export default function HomePage() {
  const { isFocusMode } = useLumiMode();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [discover, setDiscover] = useState<DiscoverPayload | null>(null);
  const [profilesById, setProfilesById] = useState<Record<string, RealtimeProfileRecord>>({});
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const fallbackPayload = buildDiscoverPayloadFromRealtime({
    profiles: {},
    posts: {}
  });

  useEffect(() => onAuthStateChanged(auth, (user: { uid: string; displayName?: string | null; photoURL?: string | null; email?: string | null } | null) => {
    setViewer(user ? {
      id: user.uid,
      name: user.displayName || "Lumi User",
      avatar: user.photoURL || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(user.uid)}`,
      username: user.email ? `@${user.email.split("@")[0]}` : undefined
    } : null);
  }), []);

  useEffect(() => {
    setIsLoading(true);
    setError("");
    setDiscover(fallbackPayload);
    setProfilesById({});

    let profiles: Record<string, RealtimeProfileRecord> = {};
    let posts: Record<string, RealtimePostRecord> = {};
    let profilesResolved = false;
    let postsResolved = false;
    let profilesFailed = false;
    let postsFailed = false;

    function syncPayload() {
      if (!profilesResolved || !postsResolved) return;
      try {
        const payload = buildDiscoverPayloadFromRealtime({
          profiles,
          posts
        });
        setDiscover(payload);
        setError([profilesFailed && "Profiles could not load.", postsFailed && "Posts could not load."].filter(Boolean).join(" "));
      } catch (loadError) {
        setDiscover(fallbackPayload);
        setError(loadError instanceof Error ? loadError.message : "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      if (!profilesResolved) { profilesResolved = true; profilesFailed = true; }
      if (!postsResolved) { postsResolved = true; postsFailed = true; }
      syncPayload();
    }, 10000);

    const profilesRef = ref(realtimeDb, "publicProfiles");
    const postsRef = query(ref(realtimeDb, "community/posts"), orderByChild("createdAt"), limitToLast(100));

    const unsubProfiles = onValue(
      profilesRef,
      (snapshot: { val: () => unknown }) => {
        profiles = (snapshot.val() as Record<string, RealtimeProfileRecord> | null) ?? {};
        setProfilesById(profiles);
        profilesResolved = true;
        profilesFailed = false;
        syncPayload();
      },
      () => {
        profilesResolved = true;
        profilesFailed = true;
        setProfilesById({});
        syncPayload();
      }
    );

    const unsubPosts = onValue(
      postsRef,
      (snapshot: { val: () => unknown }) => {
        posts = (snapshot.val() as Record<string, RealtimePostRecord> | null) ?? {};
        postsResolved = true;
        postsFailed = false;
        syncPayload();
      },
      () => {
        postsResolved = true;
        postsFailed = true;
        syncPayload();
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubProfiles();
      unsubPosts();
    };
  }, [retryKey]);

  const data = discover ?? fallbackPayload;

  const routeView =
    pathname === "/explore"
      ? "explore"
      : pathname === "/clips"
        ? "clips"
        : pathname === "/following"
          ? "following"
          : pathname === "/chat"
            ? "chat"
            : pathname === "/live"
              ? "live"
              : pathname === "/ai-lab"
                ? "ai-lab"
                : pathname === "/profile"
                  ? "profile"
                  : "feed";

  function renderActiveView() {
    switch (routeView) {
      case "explore":
        return (
          <ExplorePanel data={data} viewer={viewer} isFocusMode={isFocusMode} initialQuery={searchParams.get("tag") ?? ""} />
        );
      case "clips":
        return (
          <div className="mx-auto max-w-xl">
            <ReelsFeed feed={data.feed} viewer={viewer} interests={viewer ? profilesById[viewer.id]?.interests ?? [] : []} loadError={error} loading={isLoading} onRetry={() => setRetryKey((key) => key + 1)} isFocusMode={isFocusMode} />
          </div>
        );
      case "following":
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <CommunityFeed viewer={viewer} isFocusMode={isFocusMode} />
            <div className="space-y-6">
              <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
              <RightRail users={data.featuredUsers} trending={data.trending} viewer={viewer} isFocusMode={isFocusMode} />
            </div>
          </div>
        );
      case "chat":
        return (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-6">
              <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
              <NotificationsPanel viewer={viewer} isFocusMode={isFocusMode} />
              <UserSettingsPanel viewer={viewer} isFocusMode={isFocusMode} />
            </div>
            <ChatWindow viewer={viewer} isFocusMode={isFocusMode} />
          </div>
        );
      case "live":
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <PostComposer viewer={viewer} isFocusMode={isFocusMode} />
              <StoriesRail viewer={viewer} isFocusMode={isFocusMode} />
              <CommunitiesPanel isFocusMode={isFocusMode} />
            </div>
            <div className="space-y-6">
              <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
              <RightRail users={data.featuredUsers} trending={data.trending} viewer={viewer} isFocusMode={isFocusMode} />
            </div>
          </div>
        );
      case "ai-lab":
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <AIHub isFocusMode={isFocusMode} />
              <CreatorAnalyticsPanel isFocusMode={isFocusMode} />
              <MagicWritePanel isFocusMode={isFocusMode} />
            </div>
            <div className="space-y-6">
              <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
              <ProfileIdentityPanel viewer={viewer} isFocusMode={isFocusMode} />
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="space-y-6">
            <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
            <ProfileScreen viewer={viewer} isFocusMode={isFocusMode} />
          </div>
        );
      case "feed":
      default:
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="mx-auto w-full max-w-[640px] space-y-6">
              <StoriesRail viewer={viewer} isFocusMode={isFocusMode} />
              <PostComposer viewer={viewer} isFocusMode={isFocusMode} />
              <CommunityFeed viewer={viewer} isFocusMode={isFocusMode} />
            </div>
            <div className="space-y-6">
              <AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} />
              <RightRail users={data.featuredUsers} trending={data.trending} viewer={viewer} isFocusMode={isFocusMode} />
              <NotificationsPanel viewer={viewer} isFocusMode={isFocusMode} />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && pathname !== "/clips" && <p role="status" className={`rounded-xl border px-4 py-2.5 text-xs ${isFocusMode ? "border-slate-200 bg-white text-slate-600" : "border-sky-400/15 bg-sky-400/5 text-sky-200"}`}>Connecting to the Lumi community…</p>}
      {error && pathname !== "/clips" ? (
        <div className={`rounded-[24px] border px-4 py-3 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
          <p className={isFocusMode ? "text-sm text-slate-600" : "text-sm text-white/70"}>{error} Check the Lumi database connection, then retry.</p>
          <div className="mt-2 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setRetryKey((key) => key + 1)} className="rounded-full bg-lumi-purple px-4 py-1.5 text-sm font-semibold text-white">Retry loading</button><Link href="/demo" className="text-sm font-semibold text-lumi-purple underline">Open the separate fictional demo</Link></div>
        </div>
      ) : null}
      {renderActiveView()}
    </div>
  );
}
