"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { FeedAuthor } from "@/lib/social";

export default function StoriesRail({
  users,
  isFocusMode = false
}: {
  users: FeedAuthor[];
  isFocusMode?: boolean;
}) {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    console.log("Stories loaded");
  }, [users.length]);

  useEffect(() => {
    if (activeStoryIndex === null) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveStoryIndex((current) => {
        if (current === null) {
          return null;
        }

        return current >= users.length - 1 ? null : current + 1;
      });
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [activeStoryIndex, users.length]);

  return (
    <>
      <section className={`rounded-[24px] border p-4 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
        <div className="mb-4 flex items-center justify-between">
          <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Stories</p>
          <button
            type="button"
            onClick={() => setActiveStoryIndex(0)}
            className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}
          >
            Watch all
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1">
          <button type="button" className="group min-w-[82px] text-left">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              <div className={`flex h-full w-full items-center justify-center rounded-full ${isFocusMode ? "bg-white" : "bg-zinc-950"}`}>
                <div className="rounded-full bg-lumi-purple p-2 text-white">
                  <Plus className="h-5 w-5" />
                </div>
              </div>
            </div>
            <p className={`mt-3 text-center text-xs font-medium ${isFocusMode ? "text-slate-600" : "text-white/80"}`}>Your story</p>
          </button>

          {users.map((user, index) => (
            <button key={user.id} type="button" className="group min-w-[82px] text-left" onClick={() => setActiveStoryIndex(index)}>
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full p-[2px] ${
                  index % 2 === 0
                    ? "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600"
                    : "bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400"
                }`}
              >
                <div className={`relative h-full w-full overflow-hidden rounded-full ${isFocusMode ? "bg-white" : "bg-zinc-950"}`}>
                  <Image src={user.avatar} alt={user.name} fill sizes="(max-width: 768px) 100vw, 100px" className="object-cover transition duration-300 group-hover:scale-105" />
                </div>
              </div>
              <p className={`mt-3 truncate text-center text-xs font-medium ${isFocusMode ? "text-slate-600" : "text-white/80"}`}>{user.name.split(" ")[0]}</p>
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {activeStoryIndex !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
            onClick={() => setActiveStoryIndex(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[28px] bg-zinc-950 text-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-4 top-4 z-10 flex gap-1">
                {users.map((user, index) => (
                  <div key={user.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                      key={`${user.id}-${activeStoryIndex === index ? "active" : "idle"}`}
                      initial={{ width: index < activeStoryIndex ? "100%" : "0%" }}
                      animate={{ width: index < activeStoryIndex ? "100%" : activeStoryIndex === index ? "100%" : "0%" }}
                      transition={{ duration: activeStoryIndex === index ? 3.1 : 0.2, ease: "linear" }}
                      className="h-full rounded-full bg-white"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveStoryIndex(null)}
                className="absolute right-4 top-6 z-10 rounded-full bg-black/35 p-2 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="relative aspect-[9/16]">
                <Image
                  src={users[activeStoryIndex].avatar}
                  alt={users[activeStoryIndex].name}
                  fill
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />
                <div className="absolute inset-x-5 bottom-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/30">
                      <Image src={users[activeStoryIndex].avatar} alt={users[activeStoryIndex].name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{users[activeStoryIndex].name}</p>
                      <p className="text-xs text-white/70">{users[activeStoryIndex].username}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-semibold leading-tight">A quick story moment from {users[activeStoryIndex].name.split(" ")[0]}.</p>
                  <p className="mt-2 text-sm text-white/70">Tap the next circle to keep browsing stories in Lumi.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={activeStoryIndex === 0}
                  onClick={() => setActiveStoryIndex((current) => (current === null ? 0 : Math.max(0, current - 1)))}
                  className="px-4 py-4 text-sm text-white/80 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={activeStoryIndex === users.length - 1}
                  onClick={() => setActiveStoryIndex((current) => (current === null ? 0 : Math.min(users.length - 1, current + 1)))}
                  className="border-l border-white/10 px-4 py-4 text-sm text-white/80 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
