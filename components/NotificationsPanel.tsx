"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import { LumiViewer } from "@/components/AuthPanel";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};

export default function NotificationsPanel({
  viewer,
  isFocusMode = false
}: {
  viewer: LumiViewer | null;
  isFocusMode?: boolean;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!viewer) {
      setItems([]);
      setIsLoading(false);
      setMessage("No notifications yet.");
      return;
    }

    const notificationsRef = ref(realtimeDb, `notifications/${viewer.id}`);
    const timeout = window.setTimeout(() => {
      setIsLoading(false);
      setMessage("No notifications yet.");
    }, 10000);

    const unsubscribe = onValue(
      notificationsRef,
      (snapshot: { val: () => unknown }) => {
        const value = snapshot.val() as Record<string, Omit<NotificationItem, "id">> | null;
        if (!value) {
          setItems([]);
          setIsLoading(false);
          setMessage("No notifications yet.");
          console.log("Notifications loaded");
          return;
        }

        const next = Object.entries(value)
          .map(([id, payload]) => ({ id, ...payload }))
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5);

        setItems(next);
        setIsLoading(false);
        setMessage("");
        console.log("Notifications loaded");
      },
      () => {
        setItems([]);
        setIsLoading(false);
        setMessage("No notifications yet.");
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [viewer]);

  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-4 flex items-center gap-2 text-lumi-purple">
        <BellRing className="h-5 w-5" />
        <p className="font-display text-2xl font-semibold">Notifications</p>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>Loading notifications...</p>
        ) : items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-[24px] border p-4 ${
                isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
              }`}
            >
              <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{item.title}</p>
              <p className={isFocusMode ? "mt-2 text-sm text-slate-600" : "mt-2 text-sm text-white/65"}>{item.body}</p>
            </div>
          ))
        ) : (
          <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>
            {message || "No notifications yet"}
          </p>
        )}
      </div>
    </section>
  );
}
