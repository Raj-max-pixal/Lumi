"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { limitToLast, onValue, orderByChild, query, ref } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import AIHub from "@/components/AIHub";
import ChatWindow from "@/components/ChatWindow";
import CommunitiesPanel from "@/components/CommunitiesPanel";
import CommunityFeed from "@/components/CommunityFeed";
import CreatorAnalyticsPanel from "@/components/CreatorAnalyticsPanel";
import ExplorePanel from "@/components/ExplorePanel";
import { useLumiMode } from "@/components/LumiModeContext";
import MagicWritePanel from "@/components/MagicWritePanel";
import NotificationsPanel from "@/components/NotificationsPanel";
import PostComposer from "@/components/PostComposer";
import ProfileIdentityPanel from "@/components/ProfileIdentityPanel";
import ProfileScreen from "@/components/ProfileScreen";
import ReelsFeed from "@/components/ReelsFeed";
import RightRail from "@/components/RightRail";
import StoriesRail from "@/components/StoriesRail";
import UserSettingsPanel from "@/components/UserSettingsPanel";
import { auth, realtimeDb } from "@/lib/firebase";
import { buildDiscoverPayloadFromRealtime, DiscoverPayload, RealtimePostRecord, RealtimeProfileRecord } from "@/lib/social";

export default function HomePage() {
  const { isFocusMode } = useLumiMode();
  const pathname = usePathname();
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

  if (isLoading && pathname !== "/clips") {
    return (
      <div className={`flex min-h-[70vh] items-center justify-center rounded-[24px] border ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-lumi-purple" />
          <p className={isFocusMode ? "mt-4 text-sm text-slate-500" : "mt-4 text-sm text-white/60"}>Loading Lumi...</p>
        </div>
      </div>
    );
  }

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
          <ExplorePanel data={data} viewer={viewer} isFocusMode={isFocusMode} />
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
      {error && pathname !== "/clips" ? (
        <div className={`rounded-[24px] border px-4 py-3 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
          <p className={isFocusMode ? "text-sm text-slate-600" : "text-sm text-white/70"}>{error} Check the Lumi database connection, then retry.</p>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-2 rounded-full bg-lumi-purple px-4 py-1.5 text-sm font-semibold text-white">Retry loading</button>
        </div>
      ) : null}
      {renderActiveView()}
    </div>
  );
}
