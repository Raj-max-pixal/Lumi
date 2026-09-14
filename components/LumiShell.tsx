"use client";

import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoonStar, SunMedium } from "lucide-react";
import { usePathname } from "next/navigation";
import { LumiModeProvider } from "@/components/LumiModeContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import Sidebar from "@/components/Sidebar";

export default function LumiShell({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const isFocusMode = themeMode === "light";
  const [activeView, setActiveView] = useState<"feed" | "explore" | "clips" | "following" | "chat" | "live" | "ai-lab">("feed");
  const pathname = usePathname();

  return (
    <LumiModeProvider
      value={{
        isFocusMode,
        toggleFocusMode: () => setThemeMode((current) => (current === "light" ? "dark" : "light")),
        activeView,
        setActiveView
      }}
    >
      <div className={isFocusMode ? "min-h-screen bg-[#fafafa] text-slate-950" : "min-h-screen bg-[#09090b] text-white"}>
        <div className="mx-auto max-w-[1480px] px-4 py-4 pb-28 sm:px-6 lg:pb-4">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-4xl font-semibold tracking-tight">Lumi</p>
              <p className={isFocusMode ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-white/55"}>
                Photo sharing, reels, stories, messages, and profiles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
              className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium ${
                isFocusMode ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-zinc-900 text-white"
              }`}
            >
              {isFocusMode ? <SunMedium className="h-4 w-4 text-amber-500" /> : <MoonStar className="h-4 w-4 text-lumi-purple" />}
              <span>{isFocusMode ? "Daylight" : "Night Mode"}</span>
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <Sidebar isFocusMode={isFocusMode} />

            <AnimatePresence mode="wait">
              <motion.div
                key={pathname + String(isFocusMode)}
                initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <MobileBottomNav isFocusMode={isFocusMode} />
      </div>
    </LumiModeProvider>
  );
}
