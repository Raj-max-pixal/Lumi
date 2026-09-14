"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onValue, ref } from "firebase/database";
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
import { realtimeDb } from "@/lib/firebase";
import { buildDiscoverPayloadFromRealtime, DiscoverPayload, RealtimePostRecord, RealtimeProfileRecord } from "@/lib/social";

export default function HomePage() {
  const { isFocusMode } = useLumiMode();
  const pathname = usePathname();
  const [discover, setDiscover] = useState<DiscoverPayload | null>(null);
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const fallbackPayload = buildDiscoverPayloadFromRealtime({
    profiles: {},
    posts: {}
  });

  useEffect(() => {
    setIsLoading(true);
    setError("");
    setDiscover(fallbackPayload);

    let profiles: Record<string, RealtimeProfileRecord> = {};
    let posts: Record<string, RealtimePostRecord> = {};
    let hasResolvedOnce = false;

    function syncPayload() {
      try {
        const payload = buildDiscoverPayloadFromRealtime({
          profiles,
          posts
        });
        hasResolvedOnce = true;
        setDiscover(payload);
        setError("");
        console.log("Feed loaded");
      } catch (loadError) {
        hasResolvedOnce = true;
        setDiscover(fallbackPayload);
        setError(loadError instanceof Error ? loadError.message : "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      if (!hasResolvedOnce) {
        setDiscover(fallbackPayload);
        setIsLoading(false);
        setError("Firebase is taking too long to respond. Preview mode is showing an empty Lumi state.");
      }
    }, 10000);

    const profilesRef = ref(realtimeDb, "profiles");
    const postsRef = ref(realtimeDb, "community/posts");

    const unsubProfiles = onValue(
      profilesRef,
      (snapshot: { val: () => unknown }) => {
        const value = snapshot.val() as Record<string, { public?: RealtimeProfileRecord }> | null;
        profiles = Object.fromEntries(
          Object.entries(value ?? {}).map(([id, record]) => [id, record.public ?? {}])
        );
        syncPayload();
      },
      () => {
        if (!hasResolvedOnce) {
          setDiscover(fallbackPayload);
          setIsLoading(false);
          setError("Could not load profiles from Firebase. Preview mode is active.");
        }
      }
    );

    const unsubPosts = onValue(
      postsRef,
      (snapshot: { val: () => unknown }) => {
        posts = (snapshot.val() as Record<string, RealtimePostRecord> | null) ?? {};
        syncPayload();
      },
      () => {
        if (!hasResolvedOnce) {
          setDiscover(fallbackPayload);
          setIsLoading(false);
          setError("Could not load posts from Firebase. Preview mode is active.");
        }
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubProfiles();
      unsubPosts();
    };
  }, []);

  if (isLoading) {
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
          <ExplorePanel data={data} isFocusMode={isFocusMode} />
        );
      case "clips":
        return (
          <div className="mx-auto max-w-xl">
            <ReelsFeed feed={data.feed} isFocusMode={isFocusMode} />
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
            <ChatWindow isFocusMode={isFocusMode} />
          </div>
        );
      case "live":
        return (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <PostComposer viewer={viewer} isFocusMode={isFocusMode} />
              <StoriesRail users={data.featuredUsers} isFocusMode={isFocusMode} />
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
              <StoriesRail users={data.featuredUsers} isFocusMode={isFocusMode} />
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
      {error ? (
        <div className={`rounded-[24px] border px-4 py-3 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
          <p className={isFocusMode ? "text-sm text-slate-600" : "text-sm text-white/70"}>{error}</p>
        </div>
      ) : null}
      {renderActiveView()}
    </div>
  );
}
