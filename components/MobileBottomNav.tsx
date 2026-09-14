"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Compass, Home, MessageCircleMore, PlusSquare, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/live", label: "Create", icon: PlusSquare },
  { href: "/clips", label: "Reels", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: User }
];

export default function MobileBottomNav({ isFocusMode = false }: { isFocusMode?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 border-t px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 lg:hidden ${
        isFocusMode ? "border-slate-200 bg-white/95" : "border-white/10 bg-zinc-950/95"
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
                  ? "text-lumi-purple"
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
        className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-lumi-purple text-white shadow-lg shadow-lumi-purple/30"
      >
        <MessageCircleMore className="h-5 w-5" />
      </Link>
    </nav>
  );
}
