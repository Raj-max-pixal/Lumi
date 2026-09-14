"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { onValue, ref, set } from "firebase/database";
import { Loader2, Save } from "lucide-react";
import { realtimeDb, storage } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";
import { ensureUserProfile } from "@/lib/social-firebase";

type EditableProfile = {
  name: string;
  username: string;
  bio: string;
  avatar: string;
  city: string;
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
    city: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("Load your profile to edit it.");

  useEffect(() => {
    if (!viewer) {
      return;
    }

    const profileRef = ref(realtimeDb, `profiles/${viewer.id}/public`);
    const unsubscribe = onValue(profileRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as Partial<EditableProfile> | null;
      setProfile({
        name: value?.name ?? viewer.name,
        username: (value as Partial<EditableProfile> | null)?.username ?? viewer.username ?? `@${viewer.id.slice(0, 8)}`,
        bio: value?.bio ?? "",
        avatar: value?.avatar ?? viewer.avatar,
        city: value?.city ?? ""
      });
      setStatus("Profile synced.");
    });

    return () => unsubscribe();
  }, [viewer]);

  async function saveProfile() {
    if (!viewer) {
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

      await ensureUserProfile({
        id: viewer.id,
        name: profile.name.trim() || viewer.name,
        avatar,
        username: profile.username.trim() || viewer.username || `@${viewer.id.slice(0, 8)}`,
        bio: profile.bio.trim(),
        city: profile.city.trim()
      });

      await set(ref(realtimeDb, `profiles/${viewer.id}/meta`), {
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
