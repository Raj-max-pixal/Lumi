"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { get, onValue, push, ref, set } from "firebase/database";
import { SendHorizonal } from "lucide-react";
import { LumiViewer } from "@/components/AuthPanel";
import { realtimeDb } from "@/lib/firebase";

type ChatProfile = { id: string; name: string; avatar: string; username?: string };
type ChatMessage = { id: string; senderId: string; text: string; createdAt: number };

export default function ChatWindow({ viewer, isFocusMode = false }: { viewer: LumiViewer | null; isFocusMode?: boolean }) {
  const [people, setPeople] = useState<ChatProfile[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const selectedPerson = people.find((person) => person.id === targetId) ?? null;
  const roomId = useMemo(() => viewer && targetId ? [viewer.id, targetId].sort().join("_") : null, [viewer, targetId]);

  async function selectPerson(personId: string) {
    if (!viewer) return;
    setStatus("");
    const nextRoomId = [viewer.id, personId].sort().join("_");
    const participantsRef = ref(realtimeDb, `directMessages/${nextRoomId}/participants`);
    try {
      await set(participantsRef, {
        [viewer.id]: true,
        [personId]: true
      });
      setTargetId(personId);
    } catch {
      // An existing room is immutable. Its members can still read it.
      try {
        const existing = await get(participantsRef);
        if (!existing.child(viewer.id).exists() || !existing.child(personId).exists()) throw new Error("Not a participant");
        setTargetId(personId);
      } catch {
        setStatus("Could not open this conversation. Check Firebase access.");
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onValue(ref(realtimeDb, "publicProfiles"), (snapshot: { val: () => unknown }) => {
      const profiles = snapshot.val() as Record<string, Omit<ChatProfile, "id"> > | null;
      setPeople(Object.entries(profiles ?? {})
        .filter(([id, record]) => id !== viewer?.id && Boolean(record.name))
        .map(([id, record]) => ({
          id,
          name: record.name ?? "Lumi User",
          avatar: record.avatar ?? "https://api.dicebear.com/9.x/notionists/svg?seed=LumiProfile",
          username: record.username
        })));
    }, () => setStatus("Could not load people from Firebase."));
    return () => unsubscribe();
  }, [viewer?.id]);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }
    const unsubscribe = onValue(ref(realtimeDb, `directMessages/${roomId}/messages`), (snapshot: { val: () => unknown }) => {
      const records = snapshot.val() as Record<string, Omit<ChatMessage, "id">> | null;
      setMessages(Object.entries(records ?? {})
        .map(([id, message]) => ({ id, ...message }))
        .sort((a, b) => a.createdAt - b.createdAt));
      setStatus("");
    }, () => setStatus("Could not load this conversation."));
    return () => unsubscribe();
  }, [roomId]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!viewer || !roomId || !targetId || !text || isSending) return;
    setIsSending(true);
    setStatus("");
    try {
      await set(push(ref(realtimeDb, `directMessages/${roomId}/messages`)), {
        senderId: viewer.id,
        text,
        createdAt: Date.now()
      });
      setDraft("");
    } catch {
      setStatus("Message could not be sent. Check Firebase access.");
    } finally {
      setIsSending(false);
    }
  }

  if (!viewer) return <section className="rounded-[24px] border border-current/10 p-8 text-center">Sign in to send and receive messages.</section>;

  return (
    <section className={`grid min-h-[70vh] overflow-hidden rounded-[24px] border md:grid-cols-[260px_minmax(0,1fr)] ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
      <aside className="border-b border-current/10 p-4 md:border-b-0 md:border-r">
        <h2 className="mb-4 text-lg font-semibold">Messages</h2>
        <div className="flex gap-2 overflow-x-auto md:block md:space-y-1">
          {people.map((person) => (
            <button key={person.id} type="button" onClick={() => void selectPerson(person.id)} className={`flex min-w-[180px] items-center gap-3 rounded-xl p-2 text-left md:w-full ${targetId === person.id ? "bg-lumi-purple/15" : "hover:bg-slate-500/10"}`}>
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"><Image src={person.avatar} alt="" fill sizes="40px" className="object-cover" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{person.name}</span><span className="block truncate text-xs opacity-60">{person.username ?? `@${person.id.slice(0, 8)}`}</span></span>
            </button>
          ))}
          {!people.length ? <p className="text-sm opacity-60">No other accounts yet.</p> : null}
        </div>
      </aside>
      <div className="flex min-h-[50vh] flex-col">
        <div className="border-b border-current/10 px-5 py-4 font-semibold">{selectedPerson?.name ?? "Choose a person"}</div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {selectedPerson && !messages.length ? <p className="text-center text-sm opacity-60">Start the conversation with {selectedPerson.name}.</p> : null}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.senderId === viewer.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${message.senderId === viewer.id ? "bg-lumi-purple text-white" : isFocusMode ? "bg-slate-100 text-slate-900" : "bg-white/10"}`}>{message.text}</div>
            </div>
          ))}
        </div>
        {status ? <p role="status" className="px-4 text-sm text-rose-500">{status}</p> : null}
        <form onSubmit={(event) => void sendMessage(event)} className="flex gap-2 border-t border-current/10 p-4">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!selectedPerson || isSending} placeholder={selectedPerson ? "Message..." : "Select a person first"} className={`min-w-0 flex-1 rounded-full border border-current/10 px-4 py-2 text-sm outline-none ${isFocusMode ? "bg-slate-50" : "bg-black/20"}`} />
          <button type="submit" disabled={!selectedPerson || !draft.trim() || isSending} aria-label="Send message" className="rounded-full bg-lumi-purple p-3 text-white disabled:opacity-50"><SendHorizonal className="h-4 w-4" /></button>
        </form>
      </div>
    </section>
  );
}
