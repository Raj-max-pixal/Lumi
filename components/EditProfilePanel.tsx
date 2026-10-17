"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { auth, realtimeDb } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";
import { ensureUserProfile } from "@/lib/social-firebase";
import { isSafeUrl } from "@/lib/hackathon";
import { DEVELOPER_TOPICS } from "@/lib/developer-topics";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { compressAvatarImage, isAvatarImage, isDisplayableImageSource } from "@/lib/media";

type EditableProfile = {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  city: string;
  showLocation: boolean;
  skills: string;
  interests: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
};

export default function EditProfilePanel({
  viewer,
  isFocusMode = false
}: {
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  const [profile, setProfile] = useState<EditableProfile>({
    name: "",
    username: "",
    bio: "",
    avatar: "",
    city: "",
    showLocation: false,
    skills: "",
    interests: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("Load your profile to edit it.");
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!viewer) {
      return;
    }
    setLoadFailed(false);
    const timeout = window.setTimeout(() => { setLoadFailed(true); setStatus("Profile data is taking too long to load."); }, 10000);

    const profileRef = ref(realtimeDb, `publicProfiles/${viewer.id}`);
    const unsubscribe = onValue(profileRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as (Omit<Partial<EditableProfile>, "skills" | "interests"> & { skills?: string[] | string; interests?: string[] | string }) | null;
      setProfile({
        name: value?.name ?? viewer.name,
        username: (value as Partial<EditableProfile> | null)?.username ?? viewer.username ?? `@${viewer.id.slice(0, 8)}`,
        bio: value?.bio ?? "",
        avatar: value?.avatar ?? viewer.avatar,
        city: value?.showLocation ? value.city ?? "" : "",
        showLocation: value?.showLocation === true,
        skills: Array.isArray(value?.skills) ? value.skills.join(", ") : value?.skills ?? "",
        interests: Array.isArray(value?.interests) ? value.interests.join(", ") : value?.interests ?? "",
        portfolioUrl: value?.portfolioUrl ?? "",
        githubUrl: value?.githubUrl ?? "",
        linkedinUrl: value?.linkedinUrl ?? ""
      });
      setStatus("Profile synced.");
      setLoadFailed(false);
      window.clearTimeout(timeout);
    }, () => { setLoadFailed(true); setStatus("Could not load your profile from Lumi's database."); window.clearTimeout(timeout); });
    const unsubscribePrivate = onValue(ref(realtimeDb, `privateProfiles/${viewer.id}/city`), (snapshot: { val: () => unknown }) => {
      const privateCity = snapshot.val();
      if (typeof privateCity === "string") setProfile((current) => ({ ...current, city: privateCity }));
    });

    return () => { window.clearTimeout(timeout); unsubscribe(); unsubscribePrivate(); };
  }, [viewer, retryKey]);

  async function saveProfile() {
    if (!viewer) {
      return;
    }
    if (auth.currentUser?.uid !== viewer.id) { setStatus("Your session changed. Sign in again before saving."); return; }
    if ((profile.avatar && !isSafeUrl(profile.avatar) && !isAvatarImage(profile.avatar)) || [profile.portfolioUrl, profile.githubUrl, profile.linkedinUrl].some((url) => url && !isSafeUrl(url)) || (profile.githubUrl && !isSafeUrl(profile.githubUrl, true)) || (profile.linkedinUrl && !/^https:\/\/(www\.)?linkedin\.com\//i.test(profile.linkedinUrl))) {
      setStatus("Choose a gallery photo or use valid HTTPS avatar, portfolio, GitHub, and LinkedIn links.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const avatar = profile.avatar.trim() || viewer.avatar;

      await set(ref(realtimeDb, `privateProfiles/${viewer.id}/city`), profile.city.trim());
      await ensureUserProfile({
        id: viewer.id,
        name: profile.name.trim() || viewer.name,
        avatar,
        username: profile.username.trim() || viewer.username || `@${viewer.id.slice(0, 8)}`,
        bio: profile.bio.trim(),
        city: profile.showLocation ? profile.city.trim() : "",
        showLocation: profile.showLocation,
        skills: profile.skills.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 15),
        interests: profile.interests.split(",").map((interest) => interest.trim()).filter(Boolean).slice(0, 15),
        portfolioUrl: profile.portfolioUrl.trim(),
        githubUrl: profile.githubUrl.trim(),
        linkedinUrl: profile.linkedinUrl.trim()
      });

      await set(ref(realtimeDb, `privateProfiles/${viewer.id}/meta`), {
        updatedAt: Date.now()
      });

      setProfile((current) => ({ ...current, avatar }));
      setStatus("Profile saved.");
    } catch (error) {
      setStatus(firebaseErrorMessage(error, "Saving your profile"));
    } finally {
      setIsSaving(false);
    }
  }

  async function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsPreparingAvatar(true);
    setStatus("Preparing your avatar...");
    try {
      const avatar = await compressAvatarImage(file);
      setProfile((current) => ({ ...current, avatar }));
      setStatus("Photo ready. Select Save profile to publish it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The photo could not be prepared.");
    } finally {
      setIsPreparingAvatar(false);
      event.target.value = "";
    }
  }

  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-4">
        <p className="font-display text-2xl font-semibold text-lumi-purple">Edit Profile</p>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
          Update your bio, avatar, and identity details for the beta profile experience.
        </p>
      </div>

      {viewer ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-[24px]">
              <Image src={isDisplayableImageSource(profile.avatar) ? profile.avatar : viewer.avatar} alt={profile.name || viewer.name} fill unoptimized className="object-cover" />
            </div>
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <button type="button" onClick={() => avatarInput.current?.click()} disabled={isPreparingAvatar || isSaving} className="inline-flex items-center gap-2 rounded-xl border border-current/15 px-3 py-2 font-semibold text-lumi-purple disabled:opacity-50"><ImagePlus className="h-4 w-4" />{isPreparingAvatar ? "Preparing photo..." : "Choose avatar from gallery"}</button>
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(event) => void selectAvatar(event)} aria-label="Choose avatar from gallery" />
              <label className="block">Or use an avatar image URL<input type="url" maxLength={2048} value={isAvatarImage(profile.avatar) ? "" : profile.avatar} onChange={(event) => setProfile((current) => ({ ...current, avatar: event.target.value }))} placeholder="https://your-site.com/avatar.png" className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"}`} /></label>
              <span className="block text-xs opacity-60">{isAvatarImage(profile.avatar) ? "Gallery photo selected. Save your profile, or paste a URL to replace it." : "Gallery photos are cropped and saved as small JPEG avatars in your Lumi profile."}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              placeholder="Display name"
              className={`rounded-[24px] border px-4 py-3 text-sm outline-none ${
                isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"
              }`}
            />
            <input
              value={profile.username}
              onChange={(event) => setProfile((current) => ({ ...current, username: event.target.value.startsWith("@") ? event.target.value : `@${event.target.value}` }))}
              placeholder="@username"
              className={`rounded-[24px] border px-4 py-3 text-sm outline-none ${
                isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"
              }`}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-1">
            <input
              value={profile.city}
              onChange={(event) => setProfile((current) => ({ ...current, city: event.target.value }))}
              placeholder="City"
              className={`rounded-[24px] border px-4 py-3 text-sm outline-none ${
                isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"
              }`}
            />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profile.showLocation} onChange={(event) => setProfile((current) => ({ ...current, showLocation: event.target.checked }))} /> Show my city on my public profile</label>

          <div className="grid gap-4 md:grid-cols-2">
            <input value={profile.skills} onChange={(event) => setProfile((current) => ({ ...current, skills: event.target.value }))} placeholder="Skills: React, Python, UI design" maxLength={300} className={`rounded-[24px] border px-4 py-3 text-sm outline-none ${isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"}`} />
            <input value={profile.interests} onChange={(event) => setProfile((current) => ({ ...current, interests: event.target.value }))} placeholder="Interests: AI, open source" maxLength={300} className={`rounded-[24px] border px-4 py-3 text-sm outline-none ${isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"}`} />
          </div>
          <div><p className="mb-2 text-sm font-medium">Topics you want to learn</p><div className="flex flex-wrap gap-2">{DEVELOPER_TOPICS.map((item) => { const selected = profile.interests.split(",").map((value) => value.trim()).includes(item); return <button key={item} type="button" aria-pressed={selected} onClick={() => setProfile((current) => { const values = current.interests.split(",").map((value) => value.trim()).filter(Boolean); return { ...current, interests: (values.includes(item) ? values.filter((value) => value !== item) : [...values, item]).join(", ") }; })} className={`rounded-full border px-3 py-1.5 text-xs ${selected ? "border-lumi-purple bg-lumi-purple text-white" : isFocusMode ? "border-slate-200 text-slate-700" : "border-white/20 text-white/75"}`}>{item}</button>; })}</div></div>
          <div className="grid gap-4 md:grid-cols-3">
            {(["portfolioUrl", "githubUrl", "linkedinUrl"] as const).map((field) => <input key={field} type="url" value={profile[field]} onChange={(event) => setProfile((current) => ({ ...current, [field]: event.target.value }))} placeholder={field === "portfolioUrl" ? "Portfolio URL" : field === "githubUrl" ? "GitHub profile URL" : "LinkedIn profile URL"} className={`rounded-[24px] border px-4 py-3 text-sm outline-none ${isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"}`} />)}
          </div>

          <textarea
            value={profile.bio}
            onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Write your bio"
            className={`min-h-28 w-full rounded-[24px] border p-4 text-sm outline-none ${
              isFocusMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-white/10 bg-black/20 text-white"
            }`}
          />

          <div className="flex items-center justify-between gap-4">
            <div><p role="status" className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>{status}</p>{loadFailed && <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="mt-1 text-sm font-semibold text-lumi-purple underline">Retry loading</button>}</div>
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={isSaving || isPreparingAvatar}
              className="inline-flex items-center gap-2 rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </button>
          </div>
        </div>
      ) : (
        <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>Sign in to edit your profile.</p>
      )}
    </section>
  );
}
