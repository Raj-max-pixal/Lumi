"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { onValue, ref, set } from "firebase/database";
import { Loader2, Save } from "lucide-react";
import { realtimeDb, storage } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";
import { ensureUserProfile } from "@/lib/social-firebase";
import { isSafeUrl } from "@/lib/hackathon";

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
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("Load your profile to edit it.");

  useEffect(() => {
    if (!viewer) {
      return;
    }

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
    });
    const unsubscribePrivate = onValue(ref(realtimeDb, `privateProfiles/${viewer.id}/city`), (snapshot: { val: () => unknown }) => {
      const privateCity = snapshot.val();
      if (typeof privateCity === "string") setProfile((current) => ({ ...current, city: privateCity }));
    });

    return () => { unsubscribe(); unsubscribePrivate(); };
  }, [viewer]);

  async function saveProfile() {
    if (!viewer) {
      return;
    }
    if ([profile.portfolioUrl, profile.githubUrl, profile.linkedinUrl].some((url) => url && !isSafeUrl(url)) || (profile.githubUrl && !isSafeUrl(profile.githubUrl, true)) || (profile.linkedinUrl && !/^https:\/\/(www\.)?linkedin\.com\//i.test(profile.linkedinUrl))) {
      setStatus("Use valid HTTPS portfolio, GitHub, and LinkedIn links.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      let avatar = profile.avatar;

      if (file) {
        const avatarRef = storageRef(storage, `lumi-profiles/${viewer.id}/${Date.now()}-${file.name}`);
        await uploadBytes(avatarRef, file);
        avatar = await getDownloadURL(avatarRef);
      }

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
      setFile(null);
    } catch {
      setStatus("Unable to save profile. Check Firebase Storage and Database rules.");
    } finally {
      setIsSaving(false);
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
              <Image src={profile.avatar || viewer.avatar} alt={profile.name || viewer.name} fill className="object-cover" />
            </div>
            <label
              className={`rounded-full border px-4 py-2 text-sm ${
                isFocusMode ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-black/20 text-white/80"
              }`}
            >
              Upload avatar
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </label>
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
            <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>{status}</p>
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={isSaving}
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
