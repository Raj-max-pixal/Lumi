"use client";

import Image from "next/image";
import { Flame, Sparkles, Store, UserRound } from "lucide-react";
import { LumiViewer } from "@/components/AuthPanel";

export default function ProfileIdentityPanel({
  viewer,
  isFocusMode = false
}: {
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5 flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-[24px]">
          <Image src={viewer?.avatar ?? "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile"} alt={viewer?.name ?? "Lumi"} fill unoptimized className="object-cover" />
        </div>
        <div>
          <p className={`font-display text-2xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{viewer?.name ?? "Lumi Identity"}</p>
          <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>
            One profile for social, portfolio, resume, creator stats, and collabs.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <UserRound className="h-5 w-5 text-lumi-purple" />
          <p className={`mt-3 text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Avatar identity</p>
          <p className={isFocusMode ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-white/65"}>Your profile, creator vibe, snaps identity, and personal style live here.</p>
        </div>
        <div className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <Flame className="h-5 w-5 text-lumi-purple" />
          <p className={`mt-3 text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Streaks + snaps</p>
          <p className={isFocusMode ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-white/65"}>Daily activity, close-friends stories, and snap-inspired momentum tracking.</p>
        </div>
        <div className={`rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"}`}>
          <Store className="h-5 w-5 text-lumi-purple" />
          <p className={`mt-3 text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Local business mode</p>
          <p className={isFocusMode ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-white/65"}>Business profiles can sell products, post offers, and reach nearby users.</p>
        </div>
      </div>

      <div className={`mt-4 rounded-[28px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-lumi-purple/20 bg-lumi-purple/10"}`}>
        <div className="inline-flex items-center gap-2 text-lumi-purple">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">Collab mode + digital clone</span>
        </div>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-white/70"}>
          Shared posts, co-created dev clips, and an offline auto-reply personality layer are part of the final product direction.
        </p>
      </div>
    </section>
  );
}
