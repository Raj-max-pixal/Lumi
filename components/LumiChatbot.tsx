"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Bot, Loader2, Send, X } from "lucide-react";
import { auth } from "@/lib/firebase";

type Message = { role: "user" | "assistant"; content: string };
type ChatUser = { getIdToken: () => Promise<string> };

export default function LumiChatbot({ isFocusMode }: { isFocusMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const authVersion = useRef(0);

  useEffect(() => onAuthStateChanged(auth, (next: ChatUser | null) => {
    authVersion.current += 1;
    setUser(next);
    setMessages([]);
    setError("");
    setSending(false);
  }), []);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !user || sending) return;
    const nextMessages: Message[] = [...messages.slice(-8), { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);
    const requestAuthVersion = authVersion.current;
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: nextMessages })
      });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error || "Lumi AI could not answer. Please retry.");
      if (authVersion.current === requestAuthVersion) setMessages([...nextMessages, { role: "assistant", content: result.answer }]);
    } catch (cause) {
      if (authVersion.current === requestAuthVersion) setError(cause instanceof Error ? cause.message : "Lumi AI could not answer. Please retry.");
    } finally { if (authVersion.current === requestAuthVersion) setSending(false); }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 lg:bottom-6 lg:right-6">
      {open && <section aria-label="Lumi AI chat" className={`mb-3 flex h-[min(560px,70dvh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-2xl ${isFocusMode ? "border-slate-200 bg-white text-slate-900" : "border-sky-400/30 bg-[#0c1425] text-white"}`}>
        <header className="flex items-center justify-between border-b border-current/10 px-4 py-3">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-sky-400" /><div><h2 className="font-semibold">Lumi AI</h2><p className="text-xs opacity-60">Student developer mentor · Ollama</p></div></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close Lumi AI chat" className="rounded-lg p-1 hover:bg-current/10"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {!messages.length && <p className="rounded-xl border border-current/10 p-3 text-sm opacity-75">Ask about code, a project idea, or your next learning step. Conversations stay in this tab.</p>}
          {messages.map((message, index) => <p key={index} className={`max-w-[90%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-sky-400 text-slate-950" : "mr-auto border border-current/10"}`}>{message.content}</p>)}
          {sending && <p role="status" className="flex items-center gap-2 text-xs opacity-70"><Loader2 className="h-4 w-4 animate-spin" /> Lumi AI is thinking…</p>}
          {error && <p role="alert" className="rounded-lg border border-rose-400/30 p-2 text-xs text-rose-500">{error}</p>}
          <div ref={endRef} />
        </div>
        <form onSubmit={(event) => void send(event)} className="border-t border-current/10 p-3">
          {!user && <p className="mb-2 text-xs opacity-70">Sign in to chat with Lumi AI.</p>}
          <div className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!user || sending} maxLength={1200} aria-label="Message Lumi AI" placeholder={user ? "Ask a coding question…" : "Sign in first"} className={`min-w-0 flex-1 rounded-xl border border-current/15 px-3 py-2 text-sm outline-none ${isFocusMode ? "bg-slate-50" : "bg-[#111d32]"}`} /><button type="submit" disabled={!user || !draft.trim() || sending} aria-label="Send message to Lumi AI" className="rounded-xl bg-sky-400 px-3 text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" /></button></div>
        </form>
      </section>}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close Lumi AI" : "Open Lumi AI"} aria-expanded={open} className="ml-auto flex items-center gap-2 rounded-full border border-sky-200/30 bg-sky-400 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-sky-400/20"><Bot className="h-5 w-5" /><span>Lumi AI</span></button>
    </div>
  );
}
