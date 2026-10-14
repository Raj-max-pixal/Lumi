"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { onValue, push, ref, set } from "firebase/database";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { ArrowRight, ExternalLink, Github, ImagePlus, Loader2, MessageCircle, Plus, Send, Sparkles, ThumbsDown, ThumbsUp, Trophy, Users, X } from "lucide-react";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import { useLumiMode } from "@/components/LumiModeContext";
import { realtimeDb, storage } from "@/lib/firebase";

type Vote = "yes" | "no";
type Submission = {
  id: string; authorId: string; authorName: string; title: string; websiteUrl: string; githubUrl: string;
  description: string; videoUrl?: string; imageUrls?: string[]; serverId?: string; createdAt: number;
  votes?: Record<string, Vote>;
};
type Server = { id: string; name: string; details: string; domain: string; ownerId: string; createdAt: number; members?: Record<string, true>; messages?: Record<string, { authorId: string; authorName: string; text: string; createdAt: number }> };

function validUrl(value: string, github = false) {
  try { const url = new URL(value); return url.protocol === "https:" && (!github || ["github.com", "www.github.com"].includes(url.hostname)); } catch { return false; }
}
function dateLabel(value: number) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value); }

export default function HackathonPortal() {
  const { isFocusMode } = useLumiMode();
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [tab, setTab] = useState<"projects" | "servers">("projects");
  const [projects, setProjects] = useState<Submission[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showServerForm, setShowServerForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", websiteUrl: "", githubUrl: "", description: "", videoUrl: "", serverId: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [serverForm, setServerForm] = useState({ name: "", details: "", domain: "" });
  const [message, setMessage] = useState("");
  const surface = isFocusMode ? "border-slate-200 bg-white text-slate-950" : "border-white/10 bg-zinc-950 text-white";
  const muted = isFocusMode ? "text-slate-500" : "text-white/55";
  const field = `w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-violet-400 ${isFocusMode ? "border-slate-200 bg-slate-50 text-slate-950 placeholder:text-slate-400" : "border-white/10 bg-white/5 text-white placeholder:text-white/35"}`;
  const activeServer = servers.find((item) => item.id === selectedServer);
  const activeProject = projects.find((item) => item.id === selectedProject);
  const recentProjects = useMemo(() => [...projects].sort((a, b) => b.createdAt - a.createdAt), [projects]);

  useEffect(() => {
    const unsubs = [
      onValue(ref(realtimeDb, "hackathon/projects"), (snapshot: { val: () => Record<string, Omit<Submission, "id">> | null }) => {
        setProjects(Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({ ...value, id })));
        setLoading(false); setError("");
      }, () => { setLoading(false); setError("Projects are unavailable. Check the Firebase database connection."); }),
      onValue(ref(realtimeDb, "hackathon/servers"), (snapshot: { val: () => Record<string, Omit<Server, "id">> | null }) => {
        setServers(Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({ ...value, id })).sort((a, b) => b.createdAt - a.createdAt));
      }, () => setError("Servers are unavailable. Check the Firebase database connection."))
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, []);

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer) { setError("Sign in to submit a project."); return; }
    if (!form.title.trim() || !form.description.trim() || !validUrl(form.websiteUrl) || !validUrl(form.githubUrl, true) || (form.videoUrl && !validUrl(form.videoUrl))) {
      setError("Add a title, description, HTTPS website and GitHub URLs, and a valid HTTPS video URL if used."); return;
    }
    setBusy(true); setError("");
    try {
      const projectRef = push(ref(realtimeDb, "hackathon/projects"));
      const imageUrls: string[] = [];
      for (const file of files) {
        const asset = storageRef(storage, `hackathon/${viewer.id}/${projectRef.key}/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.]/gi, "-")}`);
        await uploadBytes(asset, file, { contentType: file.type });
        imageUrls.push(await getDownloadURL(asset));
      }
      await set(projectRef, { authorId: viewer.id, authorName: viewer.name, title: form.title.trim(), websiteUrl: form.websiteUrl.trim(), githubUrl: form.githubUrl.trim(), description: form.description.trim(), videoUrl: form.videoUrl.trim(), imageUrls, serverId: form.serverId, createdAt: Date.now() });
      setForm({ title: "", websiteUrl: "", githubUrl: "", description: "", videoUrl: "", serverId: "" }); setFiles([]); setShowForm(false);
    } catch { setError("Could not publish. Check Firebase Database and Storage access, then try again."); }
    finally { setBusy(false); }
  }

  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer) { setError("Sign in to create a server."); return; }
    if (!serverForm.name.trim() || !serverForm.details.trim() || !serverForm.domain.trim()) { setError("Add a server name, details, and domain."); return; }
    setBusy(true); setError("");
    try {
      const serverRef = push(ref(realtimeDb, "hackathon/servers"));
      await set(serverRef, { ...serverForm, name: serverForm.name.trim(), details: serverForm.details.trim(), domain: serverForm.domain.trim(), ownerId: viewer.id, createdAt: Date.now(), members: { [viewer.id]: true } });
      setSelectedServer(serverRef.key ?? ""); setServerForm({ name: "", details: "", domain: "" }); setShowServerForm(false);
    } catch { setError("Could not create the server. Check Firebase Database access."); }
    finally { setBusy(false); }
  }

  async function vote(project: Submission, choice: Vote) {
    if (!viewer) { setError("Sign in to vote."); return; }
    try { await set(ref(realtimeDb, `hackathon/projects/${project.id}/votes/${viewer.id}`), project.votes?.[viewer.id] === choice ? null : choice); }
    catch { setError("Your vote could not be saved. Try again."); }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || !activeServer || !message.trim()) { setError("Sign in and write a message first."); return; }
    try { await set(push(ref(realtimeDb, `hackathon/servers/${activeServer.id}/messages`)), { authorId: viewer.id, authorName: viewer.name, text: message.trim(), createdAt: Date.now() }); setMessage(""); }
    catch { setError("Message could not be sent. Try again."); }
  }

  async function joinServer(server: Server) {
    if (!viewer) { setError("Sign in to join a server."); return; }
    try { await set(ref(realtimeDb, `hackathon/servers/${server.id}/members/${viewer.id}`), true); setSelectedServer(server.id); }
    catch { setError("Could not join this server. Try again."); }
  }

  function imageInput(next: FileList | null) {
    const chosen = Array.from(next ?? []).slice(0, 2);
    if (chosen.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) { setError("Choose up to two images, each under 5 MB."); return; }
    setFiles(chosen); setError("");
  }

  return <main className="space-y-5 pb-12">
    <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1e1640] via-[#332068] to-[#7651df] p-6 text-white sm:p-9">
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em]"><Sparkles className="h-3.5 w-3.5" /> Build together</div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Hackathon space</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Share your project, discover what other students are building, and gather your team in a public server.</p>
        <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => { setTab("projects"); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#37206b]"><Plus className="h-4 w-4" /> Submit project</button><button onClick={() => { setTab("servers"); setShowServerForm(true); }} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white"><Users className="h-4 w-4" /> Create server</button></div>
      </div>
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5">
        <div className={`flex gap-2 rounded-2xl border p-1.5 ${surface}`}><button onClick={() => setTab("projects")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "projects" ? "bg-violet-600 text-white" : muted}`}>Projects <span className="ml-1 opacity-70">{projects.length}</span></button><button onClick={() => setTab("servers")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === "servers" ? "bg-violet-600 text-white" : muted}`}>Public servers <span className="ml-1 opacity-70">{servers.length}</span></button></div>
        {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {tab === "projects" ? <>
          {showForm && <section className={`rounded-[26px] border p-5 sm:p-6 ${surface}`}><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-500">New submission</p><h2 className="mt-1 text-xl font-bold">Show what you built</h2></div><button aria-label="Close form" onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={submitProject} className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-medium">Project title<input required maxLength={100} className={`mt-1.5 ${field}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A name people will remember" /></label><label className="text-sm font-medium">Website URL<input required type="url" className={`mt-1.5 ${field}`} value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://your-project.com" /></label><label className="text-sm font-medium">GitHub URL<input required type="url" className={`mt-1.5 ${field}`} value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/you/repo" /></label><label className="sm:col-span-2 text-sm font-medium">Description<textarea required maxLength={3000} rows={4} className={`mt-1.5 ${field}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does it do? Who is it for?" /></label><label className="text-sm font-medium">Demo video URL <span className={muted}>(optional)</span><input type="url" className={`mt-1.5 ${field}`} value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://..." /></label><label className="text-sm font-medium">Server <span className={muted}>(optional)</span><select className={`mt-1.5 ${field}`} value={form.serverId} onChange={(e) => setForm({ ...form, serverId: e.target.value })}><option value="">No server</option>{servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}</select></label><label className={`sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4 text-sm ${isFocusMode ? "border-slate-300" : "border-white/20"}`}><ImagePlus className="h-5 w-5 text-violet-500" /><span>{files.length ? files.map((file) => file.name).join(", ") : "Add up to 2 screenshots (5 MB each)"}</span><input className="hidden" type="file" accept="image/*" multiple onChange={(e) => imageInput(e.target.files)} /></label><div className="sm:col-span-2 flex items-center justify-between gap-3"><p className={`text-xs ${muted}`}>Published under {viewer?.name ?? "your Lumi account"}.</p><button disabled={busy} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Publishing…" : "Publish project"}</button></div></form>
          </section>}
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Student projects</h2><p className={`text-sm ${muted}`}>Explore demos and support your favorites.</p></div></div>
          {loading ? <div className={`rounded-2xl border p-8 text-center ${surface}`}><Loader2 className="mx-auto animate-spin text-violet-500" /></div> : recentProjects.length === 0 ? <div className={`rounded-[26px] border p-10 text-center ${surface}`}><Trophy className="mx-auto h-10 w-10 text-violet-500" /><h3 className="mt-4 text-lg font-bold">The showcase is ready</h3><p className={`mt-1 text-sm ${muted}`}>Be the first student to share a project.</p></div> : <div className="grid gap-4 md:grid-cols-2">{recentProjects.map((project) => { const yes = Object.values(project.votes ?? {}).filter((value) => value === "yes").length; const no = Object.values(project.votes ?? {}).filter((value) => value === "no").length; return <article key={project.id} className={`overflow-hidden rounded-[26px] border ${surface}`}><div className={`flex h-40 items-center justify-center overflow-hidden ${isFocusMode ? "bg-violet-50" : "bg-violet-950/50"}`}>{project.imageUrls?.[0] ? <img src={project.imageUrls[0]} alt={`${project.title} screenshot`} className="h-full w-full object-cover" /> : <Trophy className="h-12 w-12 text-violet-400" />}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className={`text-xs ${muted}`}>{project.authorName} · {dateLabel(project.createdAt)}</p><h3 className="mt-1 text-lg font-bold">{project.title}</h3></div><button aria-label={`See more about ${project.title}`} onClick={() => setSelectedProject(project.id)} className="rounded-full bg-violet-600 p-2 text-white"><ArrowRight className="h-4 w-4" /></button></div><p className={`mt-2 line-clamp-2 text-sm leading-6 ${muted}`}>{project.description}</p><div className="mt-4 flex flex-wrap items-center gap-2">{validUrl(project.websiteUrl) && <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-2 text-xs font-semibold text-white"><ExternalLink className="h-3.5 w-3.5" /> Website</a>}{validUrl(project.githubUrl, true) && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${isFocusMode ? "bg-slate-100" : "bg-white/10"}`}><Github className="h-3.5 w-3.5" /> GitHub</a>}<button onClick={() => setSelectedProject(project.id)} className="text-xs font-semibold text-violet-500">See more</button></div><div className={`mt-4 flex gap-2 border-t pt-4 ${isFocusMode ? "border-slate-100" : "border-white/10"}`}><button onClick={() => void vote(project, "yes")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${project.votes?.[viewer?.id ?? ""] === "yes" ? "bg-emerald-100 text-emerald-700" : isFocusMode ? "bg-slate-100" : "bg-white/10"}`}><ThumbsUp className="h-3.5 w-3.5" /> Yes {yes}</button><button onClick={() => void vote(project, "no")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${project.votes?.[viewer?.id ?? ""] === "no" ? "bg-rose-100 text-rose-700" : isFocusMode ? "bg-slate-100" : "bg-white/10"}`}><ThumbsDown className="h-3.5 w-3.5" /> No {no}</button></div></div></article>; })}</div>}
        </> : <>
          {showServerForm && <section className={`rounded-[26px] border p-5 sm:p-6 ${surface}`}><div className="mb-4 flex justify-between"><h2 className="text-xl font-bold">Create a public server</h2><button aria-label="Close form" onClick={() => setShowServerForm(false)}><X className="h-5 w-5" /></button></div><form onSubmit={createServer} className="space-y-3"><input required maxLength={80} className={field} placeholder="Server name" value={serverForm.name} onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })} /><input required maxLength={80} className={field} placeholder="Domain or topic (e.g. AI, climate, education)" value={serverForm.domain} onChange={(e) => setServerForm({ ...serverForm, domain: e.target.value })} /><textarea required maxLength={500} rows={3} className={field} placeholder="What are students building here?" value={serverForm.details} onChange={(e) => setServerForm({ ...serverForm, details: e.target.value })} /><button disabled={busy} className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create server"}</button></form></section>}
          <div><h2 className="text-xl font-bold">Public servers</h2><p className={`text-sm ${muted}`}>Open a server to read recent messages and join the conversation.</p></div>
          {servers.length === 0 ? <div className={`rounded-[26px] border p-10 text-center ${surface}`}><Users className="mx-auto h-10 w-10 text-violet-500" /><h3 className="mt-4 text-lg font-bold">Start a student space</h3><p className={`mt-1 text-sm ${muted}`}>Create the first public server for your team or topic.</p></div> : <div className="grid gap-4 md:grid-cols-2">{servers.map((server) => <button key={server.id} onClick={() => setSelectedServer(server.id)} className={`rounded-[24px] border p-5 text-left transition hover:border-violet-400 ${surface}`}><span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{server.domain}</span><h3 className="mt-3 text-lg font-bold">{server.name}</h3><p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{server.details}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-violet-500"><MessageCircle className="h-4 w-4" /> Open conversation <ArrowRight className="h-3 w-3" /></span></button>)}</div>}
          {activeServer && <section className={`rounded-[26px] border p-5 sm:p-6 ${surface}`}><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold uppercase tracking-widest text-violet-500">{activeServer.domain}</span><h3 className="mt-1 text-xl font-bold">{activeServer.name}</h3><p className={`mt-1 text-sm ${muted}`}>{activeServer.details}</p><p className={`mt-2 text-xs ${muted}`}>{Object.keys(activeServer.members ?? {}).length} members</p></div><button aria-label="Close server" onClick={() => setSelectedServer("")}><X className="h-5 w-5" /></button></div>{viewer && !activeServer.members?.[viewer.id] && <button onClick={() => void joinServer(activeServer)} className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Join server</button>}<div className={`mt-5 max-h-80 space-y-3 overflow-y-auto rounded-2xl p-4 ${isFocusMode ? "bg-slate-50" : "bg-white/5"}`}>{Object.entries(activeServer.messages ?? {}).sort((a, b) => a[1].createdAt - b[1].createdAt).map(([id, item]) => <div key={id}><p className="text-xs font-semibold text-violet-500">{item.authorName} <span className={muted}>· {dateLabel(item.createdAt)}</span></p><p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{item.text}</p></div>)}{!activeServer.messages && <p className={`text-sm ${muted}`}>No messages yet. Say hello to the team.</p>}</div><form onSubmit={sendMessage} className="mt-3 flex gap-2"><input maxLength={1000} className={field} placeholder={viewer ? "Write a message…" : "Sign in to chat"} value={message} onChange={(e) => setMessage(e.target.value)} /><button disabled={!viewer || !message.trim() || !activeServer.members?.[viewer.id]} aria-label="Send message" className="rounded-2xl bg-violet-600 px-4 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form></section>}
        </>}
      </div>
      <aside className="space-y-4"><AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} /><div className={`rounded-[24px] border p-5 ${surface}`}><p className="text-xs font-bold uppercase tracking-widest text-violet-500">Recent activity</p><h3 className="mt-1 text-lg font-bold">Fresh from students</h3><div className="mt-4 space-y-4">{recentProjects.slice(0, 4).map((project) => <button key={project.id} onClick={() => { setTab("projects"); setSelectedProject(project.id); }} className="block w-full text-left"><p className="text-sm font-semibold">{project.title}</p><p className={`text-xs ${muted}`}>{project.authorName} · {dateLabel(project.createdAt)}</p></button>)}{!recentProjects.length && <p className={`text-sm ${muted}`}>Projects will appear here as they are shared.</p>}</div></div></aside>
    </div>
    {activeProject && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6" onClick={() => setSelectedProject(null)}><section role="dialog" aria-modal="true" aria-label={activeProject.title} onClick={(e) => e.stopPropagation()} className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border p-5 sm:p-7 ${surface}`}><div className="flex justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-500">Project showcase</p><h2 className="mt-1 text-2xl font-bold">{activeProject.title}</h2><p className={`mt-1 text-sm ${muted}`}>By {activeProject.authorName} · {dateLabel(activeProject.createdAt)}</p></div><button aria-label="Close project" onClick={() => setSelectedProject(null)}><X className="h-5 w-5" /></button></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7">{activeProject.description}</p>{Boolean(activeProject.imageUrls?.length) && <div className="mt-5 grid gap-3 sm:grid-cols-2">{activeProject.imageUrls?.map((url, index) => <img key={url} src={url} alt={`${activeProject.title} screenshot ${index + 1}`} className="w-full rounded-2xl object-cover" />)}</div>}{activeProject.videoUrl && validUrl(activeProject.videoUrl) && <a href={activeProject.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-500">Watch demo video <ExternalLink className="h-4 w-4" /></a>}<div className="mt-5 flex flex-wrap gap-3">{validUrl(activeProject.websiteUrl) && <a href={activeProject.websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Visit website ↗</a>} {validUrl(activeProject.githubUrl, true) && <a href={activeProject.githubUrl} target="_blank" rel="noopener noreferrer" className={`rounded-full px-4 py-2.5 text-sm font-semibold ${isFocusMode ? "bg-slate-100" : "bg-white/10"}`}>View GitHub ↗</a>}{activeProject.serverId && servers.some((server) => server.id === activeProject.serverId) && <button onClick={() => { setSelectedServer(activeProject.serverId ?? ""); setTab("servers"); setSelectedProject(null); }} className="rounded-full bg-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-700">Open server</button>}</div></section></div>}
  </main>;
}
