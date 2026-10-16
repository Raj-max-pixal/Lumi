"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Home, MessageCircleMore, Trophy, User, Users } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users },
  { href: "/hackathon", label: "Hackathon", icon: Trophy },
  { href: "/clips", label: "Dev Clips", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: User }
];

export default function MobileBottomNav({ isFocusMode = false }: { isFocusMode?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 border-t px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 lg:hidden ${
        isFocusMode ? "border-slate-200 bg-white/95" : "border-white/10 bg-[#0e1525]/95"
      } backdrop-blur-xl`}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
                active
                  ? "text-sky-400"
                  : isFocusMode
                    ? "text-slate-500"
                    : "text-white/60"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
      <Link
        href="/chat"
        className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-sky-400 text-slate-950 shadow-lg shadow-sky-400/20"
      >
        <MessageCircleMore className="h-5 w-5" />
      </Link>
    </nav>
  );
}
