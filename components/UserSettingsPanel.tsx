"use client";

import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { Lock, ShieldCheck } from "lucide-react";
import { realtimeDb } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";

type SettingsState = {
  isPrivate: boolean;
  visibility: "public" | "friends" | "only-me";
  disappearingMessages: boolean;
  screenshotAlerts: boolean;
};

const defaultSettings: SettingsState = {
  isPrivate: false,
  visibility: "public",
  disappearingMessages: true,
  screenshotAlerts: true
};

export default function UserSettingsPanel({
  viewer,
  isFocusMode = false
}: {
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [status, setStatus] = useState("Syncing settings...");

  useEffect(() => {
    if (!viewer) {
      setSettings(defaultSettings);
      setStatus("Connect Firebase auth to save privacy settings.");
      return;
    }

    const settingsRef = ref(realtimeDb, `privateProfiles/${viewer.id}/settings`);
    const unsubscribe = onValue(settingsRef, (snapshot: { val: () => unknown }) => {
      const value = snapshot.val() as SettingsState | null;
      setSettings(value ?? defaultSettings);
      setStatus("Settings synced.");
    });

    return () => unsubscribe();
  }, [viewer]);

  async function patchSettings(next: SettingsState) {
    setSettings(next);
    if (!viewer) {
      return;
    }

    const settingsRef = ref(realtimeDb, `privateProfiles/${viewer.id}/settings`);
    await set(settingsRef, next);
    setStatus("Saved to Firebase.");
  }

  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5 flex items-center gap-2 text-lumi-purple">
        <ShieldCheck className="h-5 w-5" />
        <p className="font-display text-2xl font-semibold">Live Privacy Controls</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <div className="mb-2 flex items-center gap-2">
            <Lock className="h-4 w-4 text-lumi-purple" />
            <span className={isFocusMode ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white"}>Private profile</span>
          </div>
          <input
            type="checkbox"
            checked={settings.isPrivate}
            onChange={(event) => void patchSettings({ ...settings, isPrivate: event.target.checked })}
          />
        </label>

        <label className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <span className={isFocusMode ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white"}>Who can see my posts</span>
          <select
            value={settings.visibility}
            onChange={(event) =>
              void patchSettings({ ...settings, visibility: event.target.value as SettingsState["visibility"] })
            }
            className={`mt-3 w-full rounded-2xl border px-3 py-2 text-sm ${
              isFocusMode ? "border-slate-200 bg-white text-slate-900" : "border-white/10 bg-black/30 text-white"
            }`}
          >
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="only-me">Only me</option>
          </select>
        </label>

        <label className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <span className={isFocusMode ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white"}>Screenshot alerts</span>
          <div className="mt-3">
            <input
              type="checkbox"
              checked={settings.screenshotAlerts}
              onChange={(event) => void patchSettings({ ...settings, screenshotAlerts: event.target.checked })}
            />
          </div>
        </label>

        <label className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <span className={isFocusMode ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white"}>Disappearing messages</span>
          <div className="mt-3">
            <input
              type="checkbox"
              checked={settings.disappearingMessages}
              onChange={(event) => void patchSettings({ ...settings, disappearingMessages: event.target.checked })}
            />
          </div>
        </label>
      </div>

      <p className={isFocusMode ? "mt-4 text-sm text-slate-500" : "mt-4 text-sm text-white/60"}>{status}</p>
    </section>
  );
}
