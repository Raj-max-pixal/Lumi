"use client";

import Image from "next/image";
import Link from "next/link";
import { Code2, ExternalLink, Github, Grid3X3, Link2, Loader2, MapPin, PlaySquare, Pin, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { equalTo, onValue, orderByChild, query, ref, remove, update } from "firebase/database";
import { auth, realtimeDb } from "@/lib/firebase";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { LumiViewer } from "@/components/AuthPanel";
import EditProfilePanel from "@/components/EditProfilePanel";
import LumiCard from "@/components/LumiCard";
import { FirebaseProfile, toggleFollowUser } from "@/lib/social-firebase";
import { HackathonProject, isSafeUrl } from "@/lib/hackathon";
import { isDisplayableImageSource } from "@/lib/media";

type ProfileScreenProps = {
  viewer: LumiViewer | null;
  profileUserId?: string | null;
  isFocusMode?: boolean;
};

type ProfilePost = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: number;
  likes: number;
  commentsCount: number;
  shares: number;
  savedCount?: number;
  savedBy?: Record<string, true>;
  tags?: string[];
};

export default function ProfileScreen({
  viewer,
  profileUserId,
  isFocusMode = false
}: ProfileScreenProps) {
  const targetUserId = profileUserId || viewer?.id || null;
  const [profile, setProfile] = useState<FirebaseProfile | null>(null);
  const [profileState, setProfileState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [retryKey, setRetryKey] = useState(0);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [projects, setProjects] = useState<HackathonProject[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [viewerFollowing, setViewerFollowing] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "projects">("posts");
  const [profileStatus, setProfileStatus] = useState("");
  const [followBusy, setFollowBusy] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUserId) {
      setProfileState("missing");
      return;
    }
    setProfileState("loading");
    const timeout = window.setTimeout(() => setProfileState("error"), 10000);

    const profileRef = ref(realtimeDb, `publicProfiles/${targetUserId}`);
    const postsRef = query(ref(realtimeDb, "community/posts"), orderByChild("authorId"), equalTo(targetUserId));
    const projectsRef = query(ref(realtimeDb, "hackathon/projects"), orderByChild("authorId"), equalTo(targetUserId));
    const followersRef = ref(realtimeDb, `relationships/followers/${targetUserId}`);
    const followingRef = ref(realtimeDb, `relationships/following/${targetUserId}`);

    const unsubProfile = onValue(profileRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Omit<FirebaseProfile, "id"> | null;
      setProfile(value ? { id: targetUserId, ...value } : null);
      window.clearTimeout(timeout);
      setProfileState(value ? "ready" : "missing");
    }, () => { window.clearTimeout(timeout); setProfileState("error"); });

    const unsubPosts = onValue(postsRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, Omit<ProfilePost, "id">> | null;
      if (!value) {
        setPosts([]);
        return;
      }

      const nextPosts = Object.entries(value)
        .map(([id, payload]) => ({ id, ...payload }))
        .filter((post) => post.authorId === targetUserId)
        .sort((a, b) => b.createdAt - a.createdAt);

      setPosts(nextPosts);
    });

    const unsubProjects = onValue(projectsRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, Omit<HackathonProject, "id">> | null;
      setProjects(Object.entries(value ?? {}).map(([id, payload]) => ({ id, ...payload })).sort((a, b) => b.createdAt - a.createdAt));
    }, () => setProjects([]));

    const unsubFollowers = onValue(followersRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, { createdAt: number }> | null;
      setFollowers(value ? Object.keys(value) : []);
    });

    const unsubFollowing = onValue(followingRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, { createdAt: number }> | null;
      setFollowing(value ? Object.keys(value) : []);
    });

    return () => {
      window.clearTimeout(timeout);
      unsubProfile();
      unsubPosts();
      unsubProjects();
      unsubFollowers();
      unsubFollowing();
    };
  }, [targetUserId, retryKey]);

  useEffect(() => {
    if (!viewer) {
      setViewerFollowing([]);
      return;
    }

    const followingRef = ref(realtimeDb, `relationships/following/${viewer.id}`);
    const unsubscribe = onValue(followingRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Record<string, { createdAt: number }> | null;
      setViewerFollowing(value ? Object.keys(value) : []);
    });

    return () => unsubscribe();
  }, [viewer]);

  const isOwnProfile = Boolean(viewer && targetUserId === viewer.id);
  const isFollowing = Boolean(targetUserId && viewerFollowing.includes(targetUserId));

  const safeProfile = useMemo(
    () =>
      profile ?? {
        id: targetUserId ?? "unknown",
        name: viewer?.name ?? "Developer",
        username: viewer?.username ?? `@${(targetUserId ?? "unknown").slice(0, 8)}`,
        avatar: viewer?.avatar ?? "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile",
        bio: "",
        city: "",
        followersCount: followers.length,
        followingCount: following.length
      },
    [profile, targetUserId, viewer?.name, viewer?.username, viewer?.avatar, followers.length, following.length]
  );

  const tabbedPosts = useMemo(() => {
    if (activeTab === "reels") {
      return posts.filter((post) => Boolean(post.videoUrl));
    }

    return posts;
  }, [activeTab, posts]);

  async function handleFollowToggle() {
    if (!viewer || !targetUserId || targetUserId === viewer.id || followBusy) {
      return;
    }
    setFollowBusy(true);
    setProfileStatus("");
    try { await toggleFollowUser({
      currentUserId: viewer.id,
      currentUserName: viewer.name,
      targetUserId,
      targetUserName: safeProfile.name,
      isFollowing,
      currentFollowingCount: viewerFollowing.length,
      targetFollowersCount: followers.length
    }); } catch { setProfileStatus("Could not update following. Please try again."); }
    finally { setFollowBusy(false); }
  }

  async function toggleFeatured(projectId: string) {
    if (!isOwnProfile || !viewer) return;
    const current = safeProfile.featuredProjectIds ?? [];
    const next = current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId];
    if (next.length > 3) { setProfileStatus("You can feature up to three projects."); return; }
    try { await update(ref(realtimeDb, `publicProfiles/${viewer.id}`), { featuredProjectIds: next.length ? next : null }); setProfileStatus("Featured projects updated."); }
    catch { setProfileStatus("Could not update featured projects."); }
  }

  async function deleteOwnPost(post: ProfilePost) {
    if (!viewer || auth.currentUser?.uid !== viewer.id || post.authorId !== viewer.id || deletingPostId) return;
    if (!window.confirm("Delete this post and its comments permanently?")) return;
    setDeletingPostId(post.id);
    setProfileStatus("");
    try {
      await remove(ref(realtimeDb, `community/posts/${post.id}`));
      setProfileStatus("Post deleted.");
    } catch (error) {
      setProfileStatus(firebaseErrorMessage(error, "Deleting your post"));
    } finally {
      setDeletingPostId(null);
    }
  }

  const featuredProjects = projects.filter((project) => safeProfile.featuredProjectIds?.includes(project.id)).slice(0, 3);

  if (!targetUserId) return <section className="rounded-2xl border border-current/10 p-8 text-center">Sign in to create your developer profile.</section>;
  if (profileState === "loading") return <section className="rounded-2xl border border-current/10 p-8 text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-3 text-sm">Loading developer profile…</p></section>;
  if (profileState === "error") return <section role="alert" className="rounded-2xl border border-rose-400/30 p-8 text-center"><p>Could not load this profile from Lumi’s database.</p><button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-3 rounded-full bg-lumi-purple px-4 py-2 text-sm font-bold text-white">Retry loading</button></section>;
  if (profileState === "missing" && !isOwnProfile) return <section className="rounded-2xl border border-current/10 p-8 text-center">This developer profile is unavailable.</section>;

  return (
    <div className="space-y-6">
      <section className={`relative overflow-hidden rounded-[24px] border p-6 sm:p-8 ${isFocusMode ? "border-slate-200 bg-white" : "border-fuchsia-400/20 bg-gradient-to-br from-[#42243f] via-[#241b38] to-[#18122d]"}`}>
        <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-full border border-slate-200">
            <Image src={safeProfile.avatar} alt={safeProfile.name} fill unoptimized className="object-cover" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <div><p className={`text-2xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{safeProfile.name}</p><p className="text-sm opacity-60">{safeProfile.username ?? `@${safeProfile.id.slice(0, 8)}`}</p></div>
                {!isOwnProfile && viewer ? (
                  <button disabled={followBusy}
                    type="button"
                    onClick={() => void handleFollowToggle()}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      isFollowing ? (isFocusMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white") : "bg-lumi-purple text-white"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                ) : null}
              </div>
              <p className={`mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 ${isFocusMode ? "text-slate-700" : "text-white/80"}`}>{safeProfile.bio || "No bio yet."}</p>
              {safeProfile.showLocation && safeProfile.city && <p className={`mt-2 inline-flex items-center gap-1 text-sm ${isFocusMode ? "text-slate-500" : "text-white/60"}`}><MapPin className="h-3.5 w-3.5" /> {safeProfile.city}</p>}
              <div className="mt-4 flex flex-wrap gap-2">{safeProfile.skills?.map((skill) => <span key={skill} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs">{skill}</span>)}</div>
              {safeProfile.interests?.length ? <p className={`mt-3 text-xs ${isFocusMode ? "text-slate-500" : "text-white/55"}`}>Interested in {safeProfile.interests.join(" · ")}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2 text-sm">{safeProfile.portfolioUrl && isSafeUrl(safeProfile.portfolioUrl) && <a href={safeProfile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-fuchsia-300 px-3 py-1.5 font-semibold text-slate-950"><Link2 className="h-3.5 w-3.5" /> Portfolio</a>}{safeProfile.githubUrl && isSafeUrl(safeProfile.githubUrl, true) && <a href={safeProfile.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5"><Github className="h-3.5 w-3.5" /> GitHub</a>}{safeProfile.linkedinUrl && isSafeUrl(safeProfile.linkedinUrl) && <a href={safeProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5"><ExternalLink className="h-3.5 w-3.5" /> LinkedIn</a>}<button onClick={() => { void navigator.clipboard.writeText(window.location.href).then(() => setProfileStatus("Profile link copied.")).catch(() => setProfileStatus("Could not copy the profile link.")); }} className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5"><Share2 className="h-3.5 w-3.5" /> Share</button></div>
              {profileStatus && <p role="status" className="mt-3 text-sm text-fuchsia-200">{profileStatus}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-5">
              {[
                { label: "Posts", value: posts.length },
                { label: "Projects", value: projects.length },
                { label: "Followers", value: followers.length },
                { label: "Following", value: following.length },
                { label: "Saves", value: posts.reduce((sum, post) => sum + Object.keys(post.savedBy ?? {}).length, 0) }
              ].map((item) => (
                <div key={item.label} className="p-1">
                  <p className={`text-xl font-semibold ${isFocusMode ? "text-slate-950" : "text-white"}`}>{item.value}</p>
                  <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/50"}>{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-[18px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
                <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Followers</p>
                <div className="mt-3 space-y-2">
                  {followers.length ? followers.slice(0, 5).map((id) => (
                    <Link key={id} href={`/profile/${id}`} className={isFocusMode ? "block text-sm text-slate-600 hover:text-slate-900" : "block text-sm text-white/75 hover:text-white"}>
                      @{id.slice(0, 8)}
                    </Link>
                  )) : (
                    <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>No followers yet.</p>
                  )}
                </div>
              </div>

              <div className={`rounded-[18px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
                <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Following</p>
                <div className="mt-3 space-y-2">
                  {following.length ? following.slice(0, 5).map((id) => (
                    <Link key={id} href={`/profile/${id}`} className={isFocusMode ? "block text-sm text-slate-600 hover:text-slate-900" : "block text-sm text-white/75 hover:text-white"}>
                      @{id.slice(0, 8)}
                    </Link>
                  )) : (
                    <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>Not following anyone yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isOwnProfile ? <EditProfilePanel viewer={viewer} isFocusMode={isFocusMode} /> : null}

      {featuredProjects.length > 0 && <section><h2 className="mb-3 text-lg font-bold">Featured projects</h2><div className="grid gap-4 md:grid-cols-3">{featuredProjects.map((project) => <Link key={project.id} href={`/hackathon/project/${project.id}`} className={`overflow-hidden rounded-2xl border ${isFocusMode ? "border-slate-200 bg-white" : "border-fuchsia-300/20 bg-[#211533]"}`}><div className="h-36 bg-gradient-to-br from-[#64446c] to-[#141d39]">{isDisplayableImageSource(project.imageUrls?.[0] ?? "") && <img src={project.imageUrls?.[0]} alt="" className="h-full w-full object-cover" />}</div><div className="p-4"><h3 className="font-bold">{project.title}</h3><p className="mt-1 line-clamp-2 text-sm opacity-65">{project.tagline || project.description}</p></div></Link>)}</div></section>}

      <section className="space-y-5">
        <div className={`flex items-center justify-center gap-2 border-y py-3 ${isFocusMode ? "border-slate-200" : "border-white/10"}`}>
          {[
            { id: "posts", label: "Posts", icon: Grid3X3 },
            { id: "reels", label: "Dev Clips", icon: PlaySquare },
            { id: "projects", label: "Projects", icon: Code2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as "posts" | "reels" | "projects")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
                activeTab === id
                  ? isFocusMode
                    ? "bg-slate-100 text-slate-950"
                    : "bg-white/10 text-white"
                  : isFocusMode
                    ? "text-slate-500"
                    : "text-white/55"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "projects" ? projects.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => <div key={project.id} className={`overflow-hidden rounded-[22px] border transition hover:border-sky-400 ${isFocusMode ? "border-slate-200 bg-white" : "border-fuchsia-300/15 bg-[#211533]"}`}>
              <Link href={`/hackathon/project/${project.id}`}>
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#1a3653] to-[#49346b]">{isDisplayableImageSource(project.imageUrls?.[0] ?? "") ? <img src={project.imageUrls?.[0]} alt={`${project.title} thumbnail`} className="h-full w-full object-cover" /> : <Code2 className="h-9 w-9 text-sky-300" />}</div>
              <div className="p-4"><p className="text-xs font-semibold text-sky-500">{project.category || "Student project"}</p><h3 className="mt-1 font-bold">{project.title}</h3><p className={`mt-1 line-clamp-2 text-sm ${isFocusMode ? "text-slate-500" : "text-white/60"}`}>{project.tagline || project.description}</p><div className="mt-3 flex flex-wrap gap-1">{project.technologies?.slice(0, 4).map((tech) => <span key={tech} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{tech}</span>)}</div></div></Link>
              {isOwnProfile && <button type="button" onClick={() => void toggleFeatured(project.id)} className="mb-4 ml-4 inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-300"><Pin className="h-3.5 w-3.5" /> {safeProfile.featuredProjectIds?.includes(project.id) ? "Remove from featured" : "Feature project"}</button>}
            </div>)}
          </div>
        ) : <div className={`rounded-[24px] border p-8 text-center ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}><p className="text-lg font-semibold">No projects published yet</p>{isOwnProfile && <Link href="/hackathon" className="mt-2 inline-block text-sm text-sky-500">Publish your first project →</Link>}</div> : tabbedPosts.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {tabbedPosts.map((post) => (
              <LumiCard
                key={post.id}
                contentType={post.videoUrl ? "video" : post.imageUrl ? "image" : "thread"}
                isFocusMode={isFocusMode}
                author={post.authorName}
                handle={`@${post.authorId.slice(0, 8)}`}
                avatarUrl={post.authorAvatar}
                title={post.imageUrl ? "Profile post" : "Profile thread"}
                description={post.caption}
                imageUrl={post.imageUrl}
                videoUrl={post.videoUrl}
                likes={post.likes}
                commentsCount={post.commentsCount}
                shares={post.shares}
                tags={post.tags ?? ["Profile", "Post"]}
                onDelete={isOwnProfile && post.authorId === viewer?.id ? () => void deleteOwnPost(post) : undefined}
                isDeleting={deletingPostId === post.id}
              />
            ))}
          </div>
        ) : (
          <div className={`rounded-[24px] border p-8 text-center ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
            <p className={`text-xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Nothing in this tab yet</p>
            <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
              Switch tabs or publish more content to grow this profile.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
