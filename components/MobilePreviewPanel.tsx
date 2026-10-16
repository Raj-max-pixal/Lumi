"use client";

import { Smartphone, TabletSmartphone } from "lucide-react";

export default function MobilePreviewPanel({ isFocusMode = false }: { isFocusMode?: boolean }) {
  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5 flex items-center gap-2 text-lumi-purple">
        <Smartphone className="h-5 w-5" />
        <p className="font-display text-2xl font-semibold">Website + App Track</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={isFocusMode ? "text-sm leading-7 text-slate-600" : "text-sm leading-7 text-white/72"}>
          Lumi should stay web-first while keeping every core surface mobile-ready: vertical dev clips, one-thumb navigation, stories, chat,
          communities, creator analytics, and monetization rails. The website becomes the product engine, and the app becomes the fastest access point.
        </div>
        <div className="flex items-end justify-center gap-4">
          <div className={`h-56 w-28 rounded-[28px] border p-2 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"}`}>
            <div className="flex h-full flex-col gap-2 rounded-[22px] bg-gradient-to-b from-lumi-purple/30 to-transparent p-2">
              <div className="h-16 rounded-2xl bg-white/10" />
              <div className="h-24 rounded-2xl bg-white/10" />
              <div className="mt-auto flex justify-center">
                <Smartphone className="h-5 w-5 text-lumi-purple" />
              </div>
            </div>
          </div>
          <div className={`h-64 w-40 rounded-[32px] border p-2 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"}`}>
            <div className="flex h-full flex-col gap-2 rounded-[26px] bg-gradient-to-b from-lumi-cyan/20 to-transparent p-2">
              <div className="h-14 rounded-2xl bg-white/10" />
              <div className="h-28 rounded-3xl bg-white/10" />
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/10" />
                <div className="rounded-2xl bg-white/10" />
              </div>
              <div className="flex justify-center">
                <TabletSmartphone className="h-5 w-5 text-lumi-purple" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
