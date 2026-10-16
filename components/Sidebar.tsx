"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Compass, Heart, Home, MessageCircleMore, PlusSquare, Trophy, User, Users } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/hackathon", label: "Hackathon", icon: Trophy },
  { href: "/team-finder", label: "Team Finder", icon: Users },
  { href: "/community", label: "Community", icon: Users },
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
      className={`sticky top-5 hidden h-[calc(100vh-2.5rem)] rounded-[26px] border p-3.5 lg:block ${
        isFocusMode ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-[#0e1525] shadow-2xl shadow-black/20"
      }`}
    >
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
    </aside>
  );
}
