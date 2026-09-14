"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onValue, push, ref, set } from "firebase/database";
import { Camera, CirclePlus, Loader2, Mic, Phone, SendHorizonal, Sparkles, Video, Wand2 } from "lucide-react";
import { realtimeDb } from "@/lib/firebase";

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt?: number | object;
};

type ChatThread = {
  id: string;
  name: string;
  lastMessage: string;
  avatar: string;
  active?: boolean;
};

const ROOM_ID = "global-lounge";
const SELF_ID = "demo-user";
const SELF_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";

const threads: ChatThread[] = [
  {
    id: "global-lounge",
    name: "Global Lounge",
    lastMessage: "Everyone is sharing fresh posts tonight.",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    active: true
  },
  {
    id: "friends",
    name: "Close Friends",
    lastMessage: "Drop the beach photos here.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "creators",
    name: "Creator Circle",
    lastMessage: "The reel edit looks good now.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
  }
];

export default function ChatWindow({ isFocusMode = false }: { isFocusMode?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${ROOM_ID}/messages`);
    let resolved = false;
    const timeout = window.setTimeout(() => {
      if (!resolved) {
        setMessages([]);
        setIsLoading(false);
        setLoadMessage("No messages yet.");
      }
    }, 10000);

    const unsubscribe = onValue(
      roomRef,
      (snapshot: { val: () => unknown }) => {
        resolved = true;
        const value = snapshot.val() as Record<string, Omit<ChatMessage, "id">> | null;

        if (!value) {
          setMessages([]);
          setIsLoading(false);
          setLoadMessage("No messages yet.");
          console.log("Chat loaded");
          return;
        }

        const nextMessages = Object.entries(value)
          .map(([id, payload]) => ({ id, ...payload }))
          .sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));

        setMessages(nextMessages);
        setIsLoading(false);
        setLoadMessage("");
        console.log("Chat loaded");
      },
      () => {
        resolved = true;
        setMessages([]);
        setIsLoading(false);
        setLoadMessage("No messages yet.");
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const conversationText = useMemo(() => messages.map((message) => message.text), [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setIsSending(true);
    const roomRef = ref(realtimeDb, `rooms/${ROOM_ID}/messages`);
    const nextMessageRef = push(roomRef);

    await set(nextMessageRef, {
      text: draft.trim(),
      senderId: SELF_ID,
      senderName: "You",
      senderAvatar: SELF_AVATAR,
      createdAt: Date.now()
    });

    setDraft("");
    setIsSending(false);
  }

  async function handleSummarize() {
    setIsSummarizing(true);
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: conversationText })
    });
    const result = (await response.json()) as { summary?: string };
    setSummary(result.summary ?? "");
    setIsSummarizing(false);
  }

  return (
    <section
      className={`grid h-[760px] overflow-hidden rounded-[24px] border md:grid-cols-[280px_minmax(0,1fr)] ${
        isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"
      }`}
    >
      <aside className={`hidden border-r md:flex md:flex-col ${isFocusMode ? "border-slate-200" : "border-white/10"}`}>
        <div className="border-b border-inherit px-5 py-4">
          <p className={`text-lg font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>lumi.inbox</p>
          <p className={isFocusMode ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-white/55"}>Messages</p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                thread.active
                  ? isFocusMode
                    ? "bg-slate-100"
                    : "bg-white/5"
                  : "hover:bg-black/5"
              }`}
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image src={thread.avatar} alt={thread.name} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{thread.name}</p>
                <p className={isFocusMode ? "truncate text-xs text-slate-500" : "truncate text-xs text-white/55"}>{thread.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className={`flex items-center justify-between border-b px-4 py-4 ${isFocusMode ? "border-slate-200" : "border-white/10"}`}>
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full">
              <Image src={threads[0].avatar} alt={threads[0].name} fill className="object-cover" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{threads[0].name}</p>
              <p className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/55"}>Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className={isFocusMode ? "rounded-full p-2 text-slate-500 hover:bg-slate-100" : "rounded-full p-2 text-white/70 hover:bg-white/5"}>
              <Phone className="h-4 w-4" />
            </button>
            <button type="button" className={isFocusMode ? "rounded-full p-2 text-slate-500 hover:bg-slate-100" : "rounded-full p-2 text-white/70 hover:bg-white/5"}>
              <Video className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="inline-flex items-center gap-2 rounded-full bg-lumi-purple px-3 py-2 text-xs font-medium text-white"
            >
              {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Summarize
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <AnimatePresence initial={false}>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mx-auto mt-12 max-w-sm rounded-[24px] border p-6 text-center ${
                  isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"
                }`}
              >
                <p className={isFocusMode ? "text-slate-500" : "text-white/55"}>Loading messages...</p>
              </motion.div>
            ) : messages.length ? (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isSelf = message.senderId === SELF_ID;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex max-w-[85%] items-end gap-2 ${isSelf ? "flex-row-reverse" : ""}`}>
                        {!isSelf ? (
                          <div className="relative h-8 w-8 overflow-hidden rounded-full">
                            <Image src={message.senderAvatar ?? SELF_AVATAR} alt={message.senderName} fill className="object-cover" />
                          </div>
                        ) : null}
                        <div
                          className={`rounded-[22px] px-4 py-3 ${
                            isSelf
                              ? "bg-lumi-purple text-white"
                              : isFocusMode
                                ? "bg-slate-100 text-slate-800"
                                : "bg-white/5 text-white"
                          }`}
                        >
                          {!isSelf ? <p className="text-[11px] opacity-60">{message.senderName}</p> : null}
                          <p className="text-sm leading-6">{message.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mx-auto mt-12 max-w-sm rounded-[24px] border p-6 text-center ${
                  isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"
                }`}
              >
                <p className={isFocusMode ? "text-slate-500" : "text-white/55"}>
                  {loadMessage || "No messages yet. Start the conversation and Lumi will sync them in real time."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {summary ? (
          <div className={`mx-4 mb-4 rounded-[20px] border p-4 ${isFocusMode ? "border-slate-200 bg-slate-50" : "border-lumi-purple/20 bg-lumi-purple/10"}`}>
            <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-lumi-purple">
              <Wand2 className="h-4 w-4" />
              AI Summary
            </div>
            <p className={isFocusMode ? "text-sm leading-6 text-slate-700" : "text-sm leading-6 text-white/80"}>{summary}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className={`border-t px-4 py-3 ${isFocusMode ? "border-slate-200" : "border-white/10"}`}>
          <div className="mb-3 flex items-center gap-2 md:hidden">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs ${
                  thread.active
                    ? isFocusMode
                      ? "bg-slate-100 text-slate-900"
                      : "bg-white/10 text-white"
                    : isFocusMode
                      ? "bg-slate-50 text-slate-500"
                      : "bg-black/20 text-white/55"
                }`}
              >
                {thread.name}
              </button>
            ))}
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-2 ${
              isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/25"
            }`}
          >
            <button type="button" className={isFocusMode ? "rounded-full p-2 text-slate-500" : "rounded-full p-2 text-white/60"}>
              <Camera className="h-4 w-4" />
            </button>
            <button type="button" className={isFocusMode ? "rounded-full p-2 text-slate-500" : "rounded-full p-2 text-white/60"}>
              <Mic className="h-4 w-4" />
            </button>
            <button type="button" className={isFocusMode ? "rounded-full p-2 text-slate-500" : "rounded-full p-2 text-white/60"}>
              <CirclePlus className="h-4 w-4" />
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message..."
              className={`w-full bg-transparent text-sm outline-none ${
                isFocusMode ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/35"
              }`}
            />
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lumi-purple text-white transition hover:brightness-110 disabled:opacity-70"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
