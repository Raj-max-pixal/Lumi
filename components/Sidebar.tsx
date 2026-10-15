"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Clapperboard, Compass, FlaskConical, Heart, Home, MessageCircleMore, PlusSquare, Sparkles, Trophy, User, Users } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/hackathon", label: "Hackathon", icon: Trophy },
  { href: "/team-finder", label: "Team Finder", icon: Users },
  { href: "/demo", label: "Try Demo", icon: FlaskConical },
  { href: "/clips", label: "Reels", icon: Clapperboard },
  { href: "/following", label: "Following", icon: Heart },
  { href: "/chat", label: "Messages", icon: MessageCircleMore },
  { href: "/live", label: "Create", icon: PlusSquare },
  { href: "/profile", label: "Profile", icon: User }
];

export default function Sidebar({ isFocusMode = false }: { isFocusMode?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-5 hidden h-[calc(100vh-2.5rem)] flex-col justify-between rounded-[26px] border p-3.5 lg:flex ${
        isFocusMode ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0e1525] shadow-2xl shadow-black/20"
      }`}
    >
      <div>
        <div className="mb-5 flex items-center gap-2.5 border-b border-current/10 px-3 pb-5 pt-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 text-white"><Sparkles className="h-4 w-4" /></span>
          <div><div className="font-display text-xl font-bold tracking-tight">Lumi</div><p className={`text-[10px] uppercase tracking-[.18em] ${isFocusMode ? "text-slate-500" : "text-slate-400"}`}>Student network</p></div>
        </div>

        <nav className="space-y-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  active
                    ? isFocusMode
                      ? "bg-sky-50 font-semibold text-sky-700"
                      : "border border-sky-400/15 bg-gradient-to-r from-sky-400/15 to-violet-400/10 font-semibold text-white"
                    : isFocusMode
                      ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? "text-sky-400" : ""}`} />
                {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <Link href="/hackathon" className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 ${isFocusMode ? "border-sky-100 bg-sky-50" : "border-sky-400/15 bg-gradient-to-br from-sky-500/15 to-violet-500/10"}`}>
        <p className="text-[10px] font-bold uppercase tracking-[.17em] text-sky-400">Build in public</p>
        <p className="mt-2 text-sm font-semibold">Show what you made.</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-400">Explore projects <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
      </Link>
    </aside>
  );
}
