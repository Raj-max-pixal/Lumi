"use client";

import { EyeOff, LockKeyhole, ShieldAlert, TimerReset } from "lucide-react";

const controls = [
  {
    title: "Private profile toggle",
    detail: "Let people switch between discoverable creator mode and locked profile mode.",
    icon: EyeOff,
    state: "Enabled"
  },
  {
    title: "Post visibility",
    detail: "Public, Friends, or Only me controls for every post and story.",
    icon: LockKeyhole,
    state: "Configurable"
  },
  {
    title: "Screenshot alerts",
    detail: "Snap-style alerts for sensitive stories, disappearing chats, and private media.",
    icon: ShieldAlert,
    state: "Blueprint ready"
  },
  {
    title: "Disappearing messages",
    detail: "Auto-expiring messages for private rooms and close-friends chat.",
    icon: TimerReset,
    state: "Chat-ready"
  }
];

export default function PrivacySecurityPanel({ isFocusMode = false }: { isFocusMode?: boolean }) {
  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5">
        <p className="font-display text-2xl font-semibold text-lumi-purple">Privacy + Security</p>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
          This is the trust layer that keeps Lumi from feeling like just another social clone.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {controls.map(({ title, detail, icon: Icon, state }) => (
          <div
            key={title}
            className={`rounded-[28px] border p-4 ${
              isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="rounded-2xl bg-lumi-purple/15 p-3 text-lumi-purple">
                <Icon className="h-5 w-5" />
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${
                isFocusMode ? "bg-white text-slate-600" : "bg-white/10 text-white/70"
              }`}>
                {state}
              </span>
            </div>
            <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{title}</p>
            <p className={isFocusMode ? "mt-2 text-sm leading-6 text-slate-600" : "mt-2 text-sm leading-6 text-white/70"}>{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
