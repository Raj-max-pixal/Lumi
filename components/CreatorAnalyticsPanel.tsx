"use client";

import { Activity, BarChart3, Clock3, TrendingUp, Users } from "lucide-react";

const stats = [
  { label: "Reach", value: "248K", icon: Activity, note: "+22% this week" },
  { label: "Followers", value: "18.2K", icon: Users, note: "+1.4K new" },
  { label: "Engagement", value: "8.7%", icon: TrendingUp, note: "Above creator avg" },
  { label: "Best time", value: "7:00 PM", icon: Clock3, note: "AI suggestion" }
];

export default function CreatorAnalyticsPanel({ isFocusMode = false }: { isFocusMode?: boolean }) {
  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5 flex items-center gap-2 text-lumi-purple">
        <BarChart3 className="h-5 w-5" />
        <p className="font-display text-2xl font-semibold">Creator Analytics</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, note }) => (
          <div
            key={label}
            className={`rounded-[28px] border p-4 ${
              isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-2xl bg-lumi-purple/15 p-3 text-lumi-purple">
                <Icon className="h-5 w-5" />
              </div>
              <span className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/50"}>{note}</span>
            </div>
            <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>{label}</p>
            <p className={`mt-2 font-display text-3xl font-semibold ${isFocusMode ? "text-slate-950" : "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
