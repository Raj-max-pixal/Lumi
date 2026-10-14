"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Compass, Heart, Home, MessageCircleMore, PlusSquare, Trophy, User, Users } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/hackathon", label: "Hackathon", icon: Trophy },
  { href: "/team-finder", label: "Team Finder", icon: Users },
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
      className={`sticky top-4 hidden h-[calc(100vh-2rem)] flex-col justify-between rounded-[28px] border p-5 lg:flex ${
        isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"
      }`}
    >
      <div>
        <div className="mb-8 px-2">
          <div className="font-display text-4xl font-semibold tracking-tight">Lumi</div>
        </div>

        <nav className="space-y-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 text-base transition ${
                  active
                    ? isFocusMode
                      ? "bg-slate-100 text-slate-950"
                      : "bg-white/10 text-white"
                    : isFocusMode
                      ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                      : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`rounded-[24px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"}`}>
        <p className="text-sm font-semibold">Lumi</p>
        <p className={isFocusMode ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-white/70"}>
          A place for student developers to learn, share projects, and build together.
        </p>
      </div>
    </aside>
  );
}
