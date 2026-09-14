"use client";

import { Flame, MapPin, Sparkles, UserRound } from "lucide-react";

const items = [
  {
    title: "Streaks",
    description: "Daily streak tracking for snaps, chats, and close-friends activity.",
    icon: Flame
  },
  {
    title: "Avatar",
    description: "Profile avatar builder with playful identity styling and creator flair.",
    icon: UserRound
  },
  {
    title: "Location",
    description: "Drop location tags on posts, stories, snaps, and local community moments.",
    icon: MapPin
  },
  {
    title: "Snap Filters",
    description: "Blueprint-ready camera overlays, AR moods, and viral story effects.",
    icon: Sparkles
  }
];

export default function SnapToolsPanel({ isFocusMode = false }: { isFocusMode?: boolean }) {
  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5">
        <p className="font-display text-2xl font-semibold text-lumi-purple">Snap Layer</p>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
          The 20% Snapchat energy: streaks, avatars, location, snaps, and playful camera personality.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(({ title, description, icon: Icon }) => (
          <div
            key={title}
            className={`rounded-[28px] border p-4 ${
              isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
            }`}
          >
            <div className="mb-3 inline-flex rounded-2xl bg-lumi-purple/15 p-3 text-lumi-purple">
              <Icon className="h-5 w-5" />
            </div>
            <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{title}</p>
            <p className={isFocusMode ? "mt-2 text-sm leading-6 text-slate-600" : "mt-2 text-sm leading-6 text-white/65"}>{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
