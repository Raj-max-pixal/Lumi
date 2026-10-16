"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set } from "firebase/database";
import { auth, realtimeDb } from "@/lib/firebase";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { DEVELOPER_TOPICS } from "@/lib/developer-topics";

type CommunityServer = {
  id: string;
  name: string;
  description: string;
  category: string;
  ownerId: string;
  rules: string;
  createdAt: number;
  starter?: boolean;
};
type CommunityMessage = { authorId: string; text: string; createdAt: number };
type AuthUser = { uid: string; displayName?: string | null; email?: string | null };
type CommunityRecord = {
  servers?: Record<string, Omit<CommunityServer, "id" | "starter">>;
  joined?: Record<string, boolean>;
  messages?: Record<string, Record<string, CommunityMessage>>;
};

const starterServers: CommunityServer[] = [
  { id: "ai-builders", name: "AI Builders Lab", description: "Share experiments, ask questions, and build responsible AI projects together.", category: "Artificial Intelligence", ownerId: "lumi-dev", rules: "Be kind. Credit your sources. Share what you learned.", createdAt: 1, starter: true },
  { id: "mobile-makers", name: "Mobile Makers", description: "Explore Flutter and mobile app projects for students.", category: "Mobile Development", ownerId: "lumi-dev", rules: "Keep feedback constructive.", createdAt: 2, starter: true },
  { id: "secure-code", name: "Secure Code Circle", description: "Practice cybersecurity fundamentals and share learning resources.", category: "Cybersecurity", ownerId: "lumi-dev", rules: "Share only ethical, legal exercises.", createdAt: 3, starter: true }
];
const input = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-sky-500";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const primary = "rounded-full bg-sky-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-600 disabled:opacity-50";

function communityName(user: AuthUser, username?: string) {
  const handle = username?.trim().replace(/^@/, "");
  const fallback = user.displayName?.trim() || user.email?.split("@")[0] || "My";
  const value = handle || fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function CommunityHub() {
  const [viewer, setViewer] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [record, setRecord] = useState<CommunityRecord>({});
  const [dataReady, setDataReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [serverForm, setServerForm] = useState({ name: "", description: "", category: DEVELOPER_TOPICS[0] as string });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const detailsRef = useRef<HTMLElement>(null);

  useEffect(() => onAuthStateChanged(auth, (user: AuthUser | null) => { setViewer(user); setAuthReady(true); setDataReady(false); setRecord({}); setSelectedId(""); }), []);
  useEffect(() => {
    if (!viewer) return;
    const uid = viewer.uid;
    const stopProfile = onValue(ref(realtimeDb, `publicProfiles/${uid}`), (snapshot: { val: () => unknown }) => {
      const profile = snapshot.val() as { name?: string; username?: string } | null;
      setProfileName(profile?.name ?? "");
      setProfileUsername(profile?.username ?? "");
    }, () => { setProfileName(""); setProfileUsername(""); });
    const stopCommunity = onValue(ref(realtimeDb, `userCommunities/${uid}`), (snapshot: { val: () => unknown }) => {
      setRecord((snapshot.val() as CommunityRecord | null) ?? {});
      setDataReady(true);
      setError("");
    }, (cause: unknown) => { setDataReady(true); setError(firebaseErrorMessage(cause, "Loading your community")); });
    return () => { stopProfile(); stopCommunity(); };
  }, [viewer]);

  const servers = useMemo<CommunityServer[]>(() => [
    ...starterServers,
    ...Object.entries(record.servers ?? {}).map(([id, server]) => ({ ...server, id }))
  ], [record.servers]);
  const filtered = servers.filter((server) => (!category || server.category === category) && `${server.name} ${server.description} ${server.category}`.toLowerCase().includes(search.toLowerCase()));
  const selected = servers.find((server) => server.id === selectedId);
  const joined = Boolean(selected && (selected.ownerId === viewer?.uid || record.joined?.[selected.id]));
  const messages = selected ? Object.entries(record.messages?.[selected.id] ?? {}).sort((a, b) => a[1].createdAt - b[1].createdAt) : [];
  const displayName = viewer ? communityName(viewer, profileUsername) : "Your";

  useEffect(() => { if (selectedId) detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [selectedId]);
  function viewServer(id: string) {
    if (selectedId === id) detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    else setSelectedId(id);
  }
  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || serverForm.name.trim().length < 3 || serverForm.description.trim().length < 10) return;
    setBusy(true); setError("");
    try {
      const newRef = push(ref(realtimeDb, `userCommunities/${viewer.uid}/servers`));
      await set(newRef, { name: serverForm.name.trim(), description: serverForm.description.trim(), category: serverForm.category, ownerId: viewer.uid, rules: "Be respectful and stay on topic.", createdAt: Date.now() });
      setSelectedId(newRef.key ?? ""); setShowCreate(false); setServerForm({ name: "", description: "", category: DEVELOPER_TOPICS[0] }); setNotice("Server created in your private community.");
    } catch (cause) { setError(firebaseErrorMessage(cause, "Creating your server")); }
    finally { setBusy(false); }
  }
  async function joinServer() {
    if (!viewer || !selected) return;
    setBusy(true); setError("");
    try { await set(ref(realtimeDb, `userCommunities/${viewer.uid}/joined/${selected.id}`), true); setNotice(`Joined ${selected.name}.`); }
    catch (cause) { setError(firebaseErrorMessage(cause, "Joining this server")); }
    finally { setBusy(false); }
  }
  async function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || !selected || !joined || !message.trim()) return;
    setBusy(true); setError("");
    try {
      await set(push(ref(realtimeDb, `userCommunities/${viewer.uid}/messages/${selected.id}`)), { authorId: viewer.uid, text: message.trim().slice(0, 1000), createdAt: Date.now() });
      setMessage(""); setNotice("Message posted in your community.");
    } catch (cause) { setError(firebaseErrorMessage(cause, "Posting your message")); }
    finally { setBusy(false); }
  }

  if (!authReady) return <main className="p-8 text-sm">Loading Community…</main>;
  if (!viewer) return <main className={`${card} mx-auto max-w-xl`}><h1 className="text-2xl font-bold">Your Community</h1><p className="mt-2 text-sm text-slate-600">Sign in to open your private Community. Each account can view only its own servers and conversations.</p><Link href="/" className={`mt-5 inline-block ${primary}`}>Go to sign in</Link></main>;

  return <main className="space-y-5 pb-16 text-slate-900">
    <header className="rounded-[28px] bg-gradient-to-br from-[#0b1424] via-[#173558] to-[#225680] p-6 text-white sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Private to your Lumi account</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{displayName} Community</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-200">A place to explore topics and keep your own server notes. Only you can open this Community. Starter spaces are maintained by Lumi Dev; posts here are private to your account.</p>
      <p className="mt-3 text-xs text-slate-300">Signed in as {profileName || viewer.displayName || displayName}</p>
      <div className="mt-5 flex flex-wrap gap-2"><Link href="/hackathon" className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold">Explore projects ↗</Link><Link href="/team-finder" className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold">Find teams ↗</Link><Link href="/clips" className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold">Dev Clips ↗</Link></div>
    </header>
    {error && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm">{notice}</p>}
    {!dataReady ? <p className={card}>Loading your servers…</p> : <>
      <div className="flex flex-wrap items-center gap-3"><input aria-label="Search servers" className={`${input} min-w-[220px] flex-1`} placeholder="Search servers" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Server category" className={`${input} w-auto`} value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All topics</option>{DEVELOPER_TOPICS.map((topic) => <option key={topic}>{topic}</option>)}</select><button onClick={() => setShowCreate((value) => !value)} className={primary}>+ New server</button></div>
      {showCreate && <form onSubmit={(event) => void createServer(event)} className={`${card} grid gap-3 sm:grid-cols-2`}><h2 className="sm:col-span-2 text-lg font-bold">Create a server</h2><input required minLength={3} maxLength={80} className={input} placeholder="Server name" aria-label="Server name" value={serverForm.name} onChange={(event) => setServerForm({ ...serverForm, name: event.target.value })} /><select className={input} aria-label="Category" value={serverForm.category} onChange={(event) => setServerForm({ ...serverForm, category: event.target.value })}>{DEVELOPER_TOPICS.map((topic) => <option key={topic}>{topic}</option>)}</select><textarea required minLength={10} maxLength={500} className={`${input} sm:col-span-2`} placeholder="What will you build or discuss?" aria-label="Description" value={serverForm.description} onChange={(event) => setServerForm({ ...serverForm, description: event.target.value })} /><button disabled={busy} className={primary}>Create server</button></form>}
      <div className="grid gap-4 md:grid-cols-2">{filtered.map((server) => <article key={server.id} className={card}><div className="flex justify-between gap-3"><span className="text-xs font-semibold text-sky-600">{server.category}</span>{server.starter && <span className="text-xs text-slate-500">Starter space</span>}</div><h2 className="mt-2 text-xl font-bold">{server.name}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-600">{server.description}</p><p className="mt-3 text-xs text-slate-500">Owner: {server.starter ? "Lumi Dev" : displayName}</p><button onClick={() => viewServer(server.id)} className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">View server →</button></article>)}{!filtered.length && <p className={card}>No servers match your search.</p>}</div>
      {selected && <section ref={detailsRef} className={`${card} scroll-mt-6`}><div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-sky-600">{selected.category} · Owner: {selected.starter ? "Lumi Dev" : displayName}</p><h2 className="mt-1 text-2xl font-bold">{selected.name}</h2></div><button aria-label="Close server details" onClick={() => setSelectedId("")}>✕</button></div><p className="mt-3 text-sm">{selected.description}</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><strong>Rules:</strong> {selected.rules}</p>{!joined && <button onClick={() => void joinServer()} disabled={busy} className={`mt-4 ${primary}`}>Join server</button>}<div className="mt-5"><h3 className="font-semibold">Your conversation</h3><div className="mt-2 space-y-2">{messages.map(([id, item]) => <div key={id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="text-xs font-bold text-sky-600">{profileName || displayName} · {new Date(item.createdAt).toLocaleDateString()}</p><p className="mt-1 whitespace-pre-wrap break-words">{item.text}</p></div>)}{!messages.length && <p className="text-sm text-slate-500">No messages yet.</p>}</div>{joined && <form onSubmit={(event) => void postMessage(event)} className="mt-3 flex gap-2"><input className={input} maxLength={1000} required aria-label="New message" placeholder="Share an idea or question" value={message} onChange={(event) => setMessage(event.target.value)} /><button disabled={busy} className={primary}>Post</button></form>}</div></section>}
    </>}
  </main>;
}
