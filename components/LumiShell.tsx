"use client";

import { ReactNode, useState } from "react";
import { MoonStar, SunMedium, Sparkles } from "lucide-react";
import { LumiModeProvider } from "@/components/LumiModeContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import Sidebar from "@/components/Sidebar";

export default function LumiShell({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const isFocusMode = themeMode === "light";
  const [activeView, setActiveView] = useState<"feed" | "explore" | "clips" | "following" | "chat" | "live" | "ai-lab">("feed");
  return (
    <LumiModeProvider
      value={{
        isFocusMode,
        toggleFocusMode: () => setThemeMode((current) => (current === "light" ? "dark" : "light")),
        activeView,
        setActiveView
      }}
    >
      <div className={isFocusMode ? "min-h-screen bg-[#f5f7fb] text-slate-950" : "lumi-dark min-h-screen bg-[#070b15] text-white"}>
        <div className="mx-auto max-w-[1540px] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mb-7 flex items-center justify-between gap-4 border-b border-current/10 pb-5">
            <div>
              <p className="flex items-center gap-2 font-display text-2xl font-bold tracking-[-.05em] sm:text-3xl"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 text-white shadow-lg shadow-violet-500/20"><Sparkles className="h-5 w-5" /></span>Lumi<span className="hidden rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-sky-400 sm:inline">Developer space</span></p>
              <p className={isFocusMode ? "mt-1 text-xs text-slate-500 sm:text-sm" : "mt-1 text-xs text-slate-400 sm:text-sm"}>
                Learn. Build. Share what matters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 sm:px-4 sm:text-sm ${
                isFocusMode ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {isFocusMode ? <SunMedium className="h-4 w-4 text-amber-500" /> : <MoonStar className="h-4 w-4 text-lumi-purple" />}
              <span>{isFocusMode ? "Light" : "Dark"}</span>
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[228px_minmax(0,1fr)] xl:gap-7">
            <Sidebar isFocusMode={isFocusMode} />
            <div className="min-w-0">{children}</div>
          </div>
        </div>
        <MobileBottomNav isFocusMode={isFocusMode} />
      </div>
    </LumiModeProvider>
  );
}
