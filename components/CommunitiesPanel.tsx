"use client";

import { Hash, Megaphone, Shield, Users2 } from "lucide-react";

const communities = [
  { name: "Tech Tonight", members: "18K members", type: "Topic feed" },
  { name: "Indie Creators", members: "9.4K members", type: "Monetization hub" },
  { name: "Cinema Club", members: "24K members", type: "Watch parties" },
  { name: "Campus Buzz", members: "5.2K members", type: "Local communities" }
];

export default function CommunitiesPanel({ isFocusMode = false }: { isFocusMode?: boolean }) {
  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="font-display text-2xl font-semibold text-lumi-purple">Communities</p>
          <p className={isFocusMode ? "mt-2 text-sm leading-7 text-slate-600" : "mt-2 text-sm leading-7 text-white/70"}>
            Groups, topic feeds, anonymous posting, creator collabs, and channel-style broadcast spaces are how Lumi becomes viral instead of
            just visually good.
          </p>
        </div>
        <div className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-lumi-purple">
              <Users2 className="h-4 w-4" />
              Group spaces
            </div>
            <div className="flex items-center gap-2 text-sm text-lumi-purple">
              <Hash className="h-4 w-4" />
              Topic channels
            </div>
            <div className="flex items-center gap-2 text-sm text-lumi-purple">
              <Megaphone className="h-4 w-4" />
              Broadcast mode
            </div>
            <div className="flex items-center gap-2 text-sm text-lumi-purple">
              <Shield className="h-4 w-4" />
              Anonymous option
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {communities.map((community) => (
          <div
            key={community.name}
            className={`rounded-[28px] border p-4 ${
              isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
            }`}
          >
            <p className={`text-base font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{community.name}</p>
            <p className={isFocusMode ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-white/55"}>{community.members}</p>
            <p className={isFocusMode ? "mt-3 text-sm text-slate-600" : "mt-3 text-sm text-white/70"}>{community.type}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
