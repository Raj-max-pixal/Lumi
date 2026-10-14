"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { limitToLast, onValue, orderByChild, push, query, ref, set } from "firebase/database";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { ArrowRight, ArrowUpRight, BookOpen, Bookmark, Code2, Filter, ImagePlus, Loader2, MessageCircle, Plus, Search, Send, Sparkles, Users, X } from "lucide-react";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import { useLumiMode } from "@/components/LumiModeContext";
import { realtimeDb, storage } from "@/lib/firebase";
import { formatProjectDate, HackathonProject, HackathonServer, isSafeUrl, PROJECT_CATEGORIES } from "@/lib/hackathon";

const emptyForm = {
  title: "", tagline: "", description: "", category: "Web Development", technologies: "",
  websiteUrl: "", githubUrl: "", videoUrl: "", hackathonName: "", teamMembers: "", serverId: ""
};

export default function HackathonShowcase() {
  const { isFocusMode } = useLumiMode();
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [projects, setProjects] = useState<HackathonProject[]>([]);
  const [servers, setServers] = useState<HackathonServer[]>([]);
  const [section, setSection] = useState<"projects" | "servers">("projects");
  const [showPublish, setShowPublish] = useState(false);
  const [showServerForm, setShowServerForm] = useState(false);
  const [myProjects, setMyProjects] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [technology, setTechnology] = useState("All technologies");
  const [sort, setSort] = useState<"newest" | "liked" | "discussed">("newest");
  const [form, setForm] = useState(emptyForm);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [serverForm, setServerForm] = useState({ name: "", domain: "", details: "" });
  const [selectedServer, setSelectedServer] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dark = !isFocusMode;
  const card = dark ? "border-white/10 bg-[#131a2a] text-white" : "border-slate-200 bg-white text-slate-950";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const input = `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15 ${dark ? "border-white/10 bg-[#0d1422] text-white placeholder:text-slate-500" : "border-slate-200 bg-white text-slate-950 placeholder:text-slate-400"}`;
  const selected = servers.find((server) => server.id === selectedServer);
  const technologies = useMemo(() => [...new Set(projects.flatMap((project) => project.technologies ?? []))].sort().slice(0, 50), [projects]);

  useEffect(() => {
    const urls = screenshots.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [screenshots]);
  useEffect(() => setVisibleCount(12), [search, category, technology, sort, myProjects]);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    const timeout = window.setTimeout(() => { setLoading(false); setLoadError("Projects are taking too long to load. Check the Lumi database connection."); }, 10000);
    const unsubscribeProjects = onValue(query(ref(realtimeDb, "hackathon/projects"), orderByChild("createdAt"), limitToLast(60)), (snapshot: { val: () => Record<string, Omit<HackathonProject, "id">> | null }) => {
      setProjects(Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({ id, ...value })));
      window.clearTimeout(timeout); setLoading(false); setLoadError("");
    }, () => { window.clearTimeout(timeout); setLoading(false); setLoadError("Projects cannot load until the Lumi database is available."); });
    const unsubscribeServers = onValue(query(ref(realtimeDb, "hackathon/servers"), orderByChild("createdAt"), limitToLast(40)), (snapshot: { val: () => Record<string, Omit<HackathonServer, "id">> | null }) => {
      setServers(Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => b.createdAt - a.createdAt));
    }, () => setError("Servers cannot load until the Lumi database is available."));
    return () => { window.clearTimeout(timeout); unsubscribeProjects(); unsubscribeServers(); };
  }, [retryKey]);

  const visible = useMemo(() => projects.filter((project) => {
    if (myProjects && project.authorId !== viewer?.id) return false;
    if (category !== "All categories" && project.category !== category) return false;
    if (technology !== "All technologies" && !project.technologies?.includes(technology)) return false;
    const term = search.trim().toLowerCase();
    return !term || [project.title, project.tagline, project.description, project.authorName, ...(project.technologies ?? [])].join(" ").toLowerCase().includes(term);
  }).sort((a, b) => sort === "liked" ? Object.keys(b.likedBy ?? {}).length - Object.keys(a.likedBy ?? {}).length || b.createdAt - a.createdAt : sort === "discussed" ? Object.keys(b.comments ?? {}).length - Object.keys(a.comments ?? {}).length || b.createdAt - a.createdAt : b.createdAt - a.createdAt), [projects, myProjects, viewer?.id, category, technology, search, sort]);
  const featured = useMemo(() => projects.filter((project) => Object.keys(project.likedBy ?? {}).length > 0).sort((a, b) => Object.keys(b.likedBy ?? {}).length - Object.keys(a.likedBy ?? {}).length).slice(0, 3), [projects]);

  function chooseImages(list: FileList | null) {
    const next = Array.from(list ?? []);
    if (next.length > 2 || next.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
      setError("Choose up to two images, each under 5 MB."); return;
    }
    setScreenshots(next); setError("");
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!viewer) { setError("Sign in to publish a project."); return; }
    if (!form.title.trim() || !form.tagline.trim() || !form.technologies.trim() || (form.websiteUrl && !isSafeUrl(form.websiteUrl)) || (form.githubUrl && !isSafeUrl(form.githubUrl, true)) || (form.videoUrl && !isSafeUrl(form.videoUrl))) {
      setError("Add a title, short description, and technologies. Any links must use HTTPS, and GitHub links must point to GitHub."); return;
    }
    setBusy(true); setError(""); setSuccess("");
    try {
      const nextRef = push(ref(realtimeDb, "hackathon/projects"));
      const imageUrls: string[] = [];
      for (const image of screenshots) {
        const path = storageRef(storage, `hackathon/${viewer.id}/${nextRef.key}/${crypto.randomUUID()}-${image.name.replace(/[^a-z0-9.]/gi, "-")}`);
        await uploadBytes(path, image, { contentType: image.type });
        imageUrls.push(await getDownloadURL(path));
      }
      await set(nextRef, {
        authorId: viewer.id, authorName: viewer.name, authorAvatar: viewer.avatar,
        title: form.title.trim(), tagline: form.tagline.trim(), description: form.description.trim() || form.tagline.trim(), category: form.category,
        technologies: form.technologies.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 10),
        websiteUrl: form.websiteUrl.trim(), githubUrl: form.githubUrl.trim(), videoUrl: form.videoUrl.trim(),
        hackathonName: form.hackathonName.trim(), teamMembers: form.teamMembers.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12),
        serverId: form.serverId, imageUrls, createdAt: Date.now()
      });
      setForm(emptyForm); setScreenshots([]); setShowPublish(false); setSuccess("Project published to the showcase.");
    } catch { setError("Publishing failed. Check the Lumi database and storage connection."); }
    finally { setBusy(false); }
  }

  async function createServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!viewer) { setError("Sign in to create a server."); return; }
    if (!serverForm.name.trim() || !serverForm.domain.trim() || !serverForm.details.trim()) { setError("Add a server name, topic, and description."); return; }
    setBusy(true); setError("");
    try {
      const nextRef = push(ref(realtimeDb, "hackathon/servers"));
      await set(nextRef, { ownerId: viewer.id, name: serverForm.name.trim(), domain: serverForm.domain.trim(), details: serverForm.details.trim(), createdAt: Date.now(), members: { [viewer.id]: true } });
      setSelectedServer(nextRef.key ?? ""); setServerForm({ name: "", domain: "", details: "" }); setShowServerForm(false); setSuccess("Server created.");
    } catch { setError("Server creation failed. Check the Lumi database connection."); }
    finally { setBusy(false); }
  }

  async function joinServer(server: HackathonServer) {
    if (!viewer) { setError("Sign in to join a server."); return; }
    try { await set(ref(realtimeDb, `hackathon/servers/${server.id}/members/${viewer.id}`), true); setSuccess(`Joined ${server.name}.`); }
    catch { setError("Could not join the server."); }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || !selected?.members?.[viewer.id] || !message.trim()) return;
    try { await set(push(ref(realtimeDb, `hackathon/servers/${selected.id}/messages`)), { authorId: viewer.id, authorName: viewer.name, text: message.trim().slice(0, 1000), createdAt: Date.now() }); setMessage(""); }
    catch { setError("Message could not be sent."); }
  }

  async function toggleBookmark(project: HackathonProject) {
    if (!viewer) { setError("Sign in to bookmark a project."); return; }
    try { await set(ref(realtimeDb, `hackathon/projects/${project.id}/savedBy/${viewer.id}`), project.savedBy?.[viewer.id] ? null : true); setError(""); }
    catch { setError("Could not update your bookmark. Try again."); }
  }

  return <main className="space-y-5 pb-10">
    <header className="relative overflow-hidden rounded-[28px] bg-[#0c1425] px-6 py-7 text-white sm:px-8 sm:py-9">
      <div className="absolute -right-10 -top-28 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-20 h-32 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-6"><div><span className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300"><Sparkles className="h-3.5 w-3.5" /> Build • Share • Collaborate</span><h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Hackathon showcase</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Discover student projects, learn from real builds, and find your next team.</p></div><button onClick={() => { setSection("projects"); setShowPublish(true); }} className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-300"><Plus className="h-4 w-4" /> Publish a project</button></div>
      <div className="relative mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"><div><strong className="text-2xl">{projects.length}</strong><p className="text-xs text-slate-400">Projects to explore</p></div><div><strong className="text-2xl">{servers.length}</strong><p className="text-xs text-slate-400">Public servers</p></div><div><strong className="text-2xl">{new Set(projects.map((item) => item.authorId)).size}</strong><p className="text-xs text-slate-400">Student builders</p></div></div>
    </header>

    <nav aria-label="Hackathon sections" className={`grid grid-cols-2 gap-1 rounded-2xl border p-1.5 sm:grid-cols-4 ${card}`}>
      <button onClick={() => { setSection("projects"); setMyProjects(false); }} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${section === "projects" && !myProjects ? "bg-sky-400 text-slate-950" : muted}`}>Explore projects</button>
      <button onClick={() => { setSection("projects"); setMyProjects(true); }} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${section === "projects" && myProjects ? "bg-sky-400 text-slate-950" : muted}`}>My projects</button>
      <button onClick={() => setSection("servers")} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${section === "servers" ? "bg-sky-400 text-slate-950" : muted}`}>Public servers</button>
      <Link href="/team-finder" className={`rounded-xl px-3 py-2.5 text-center text-sm font-semibold ${muted}`}>Find a team</Link>
    </nav>
    {error && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
    {loadError && <div role="alert" className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{loadError}<button type="button" onClick={() => setRetryKey((key) => key + 1)} className="ml-3 font-bold underline">Retry</button></div>}
    {success && <p role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{success}</p>}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_285px]">
      <div className="min-w-0 space-y-5">
        {section === "projects" ? <>
          {showPublish && <section className={`rounded-[24px] border p-5 sm:p-6 ${card}`}><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-500">New project</p><h2 className="mt-1 text-xl font-bold">Share what you built</h2><p className={`mt-1 text-sm ${muted}`}>Your Lumi name and profile picture appear with this submission.</p></div><button aria-label="Close publish form" onClick={() => setShowPublish(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={publish} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Project title<input required maxLength={100} className={`mt-1.5 ${input}`} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Give your project a name" /></label>
              <label className="text-sm font-semibold">Category<select className={`mt-1.5 ${input}`} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{PROJECT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="sm:col-span-2 text-sm font-semibold">Short description<input required maxLength={160} className={`mt-1.5 ${input}`} value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} placeholder="One sentence about the problem you solve" /></label>
              <label className="sm:col-span-2 text-sm font-semibold">The full story <span className={muted}>(optional)</span><textarea rows={4} maxLength={3000} className={`mt-1.5 ${input}`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What did you build, how does it work, and what did you learn?" /></label>
              <label className="sm:col-span-2 text-sm font-semibold">Technologies used<input required maxLength={250} className={`mt-1.5 ${input}`} value={form.technologies} onChange={(event) => setForm({ ...form, technologies: event.target.value })} placeholder="React, Firebase, Python (separate with commas)" /></label>
              <label className="text-sm font-semibold">Live website URL <span className={muted}>(optional)</span><input type="url" className={`mt-1.5 ${input}`} value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://yourproject.com" /></label>
              <label className="text-sm font-semibold">GitHub repository URL <span className={muted}>(optional)</span><input type="url" className={`mt-1.5 ${input}`} value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} placeholder="https://github.com/you/project" /></label>
              <label className="text-sm font-semibold">Demo video URL <span className={muted}>(optional)</span><input type="url" className={`mt-1.5 ${input}`} value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} placeholder="https://..." /></label>
              <label className="text-sm font-semibold">Hackathon name <span className={muted}>(optional)</span><input maxLength={100} className={`mt-1.5 ${input}`} value={form.hackathonName} onChange={(event) => setForm({ ...form, hackathonName: event.target.value })} placeholder="Event name" /></label>
              <label className="text-sm font-semibold">Team members <span className={muted}>(optional)</span><input maxLength={250} className={`mt-1.5 ${input}`} value={form.teamMembers} onChange={(event) => setForm({ ...form, teamMembers: event.target.value })} placeholder="Names, separated with commas" /></label>
              <label className="text-sm font-semibold">Public server <span className={muted}>(optional)</span><select className={`mt-1.5 ${input}`} value={form.serverId} onChange={(event) => setForm({ ...form, serverId: event.target.value })}><option value="">None</option>{servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}</select></label>
              <label className={`sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm ${dark ? "border-white/20" : "border-slate-300"}`}><ImagePlus className="h-5 w-5 text-sky-500" /><span>{screenshots.length ? screenshots.map((file) => file.name).join(", ") : "Add up to 2 screenshots • 5 MB each"}</span><input className="hidden" type="file" accept="image/*" multiple onChange={(event) => chooseImages(event.target.files)} /></label>
              {imagePreviews.length > 0 && <div className="sm:col-span-2 grid grid-cols-2 gap-3">{imagePreviews.map((url, index) => <img key={url} src={url} alt={`Screenshot preview ${index + 1}`} className="h-32 w-full rounded-xl object-cover" />)}</div>}
              <div className={`sm:col-span-2 rounded-xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}><p className={`text-xs font-bold uppercase tracking-widest ${muted}`}>Submission preview</p><h3 className="mt-1 font-bold">{form.title || "Your project title"}</h3><p className={`mt-1 text-sm ${muted}`}>{form.tagline || "Your short description appears here."}</p><p className="mt-2 text-xs text-sky-500">{form.category} {form.technologies && `· ${form.technologies}`}</p></div>
              <div className="sm:col-span-2 flex justify-end"><button disabled={busy} className="rounded-full bg-sky-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Publishing…" : "Publish project"}</button></div>
            </form>
          </section>}
          {featured.length > 0 && !myProjects && !search && category === "All categories" && <section><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-sky-500" /><h2 className="text-lg font-bold">Community favorites</h2></div><div className="grid gap-3 sm:grid-cols-3">{featured.map((project) => <Link key={project.id} href={`/hackathon/project/${project.id}`} className="rounded-2xl border border-sky-400/20 bg-[#111b30] p-4 text-white transition hover:border-sky-400/60"><p className="text-xs font-semibold text-sky-300">{project.category || "Project"}</p><h3 className="mt-2 line-clamp-1 font-bold">{project.title}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-400">{project.tagline || project.description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs text-sky-300">View project <ArrowRight className="h-3 w-3" /></span></Link>)}</div></section>}
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">{myProjects ? "My projects" : "Explore projects"}</h2><p className={`mt-0.5 text-sm ${muted}`}>{myProjects ? "Your developer portfolio on Lumi." : "Real ideas from student builders."}</p></div><span className={`text-xs ${muted}`}>{visible.length} shown</span></div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_170px_160px_150px]"><label className="relative"><Search className={`absolute left-3 top-3 h-4 w-4 ${muted}`} /><input aria-label="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} className={`${input} pl-9`} placeholder="Search projects or technology" /></label><label className="relative"><Filter className={`absolute left-3 top-3 h-4 w-4 ${muted}`} /><select aria-label="Filter by category" className={`${input} pl-9`} value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{PROJECT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><select aria-label="Filter by technology" className={input} value={technology} onChange={(event) => setTechnology(event.target.value)}><option>All technologies</option>{technologies.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Sort projects" className={input} value={sort} onChange={(event) => setSort(event.target.value as "newest" | "liked" | "discussed")}><option value="newest">Newest</option><option value="liked">Most liked</option><option value="discussed">Most discussed</option></select></div>
          {loading ? <div className={`rounded-2xl border p-8 ${card}`}><Loader2 className="mx-auto animate-spin text-sky-500" /><p className={`mt-3 text-center text-sm ${muted}`}>Loading projects…</p></div> : visible.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{visible.slice(0, visibleCount).map((project) => <article key={project.id} className={`overflow-hidden rounded-[22px] border transition hover:-translate-y-0.5 hover:shadow-lg ${card}`}><div className="flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#20365b] via-[#293456] to-[#4a2f62]">{project.imageUrls?.[0] ? <img src={project.imageUrls[0]} alt={`${project.title} thumbnail`} className="h-full w-full object-cover" /> : <div className="px-4 text-center"><Code2 className="mx-auto mb-3 h-7 w-7 text-sky-300" /><strong className="line-clamp-2 text-lg uppercase tracking-wide text-white">{project.title}</strong></div>}</div><div className="p-4"><p className="text-xs font-semibold text-sky-500">{project.category || "Student project"}</p><h3 className="mt-1 line-clamp-1 text-base font-bold">{project.title}</h3><p className={`mt-1 line-clamp-2 min-h-10 text-sm leading-5 ${muted}`}>{project.tagline || project.description}</p><div className="mt-3 flex flex-wrap gap-1">{project.technologies?.slice(0, 3).map((tech) => <span key={tech} className={`rounded-full px-2 py-1 text-[11px] ${dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{tech}</span>)}</div><div className={`mt-4 flex items-center justify-between border-t pt-3 ${dark ? "border-white/10" : "border-slate-100"}`}><div className="flex min-w-0 items-center gap-2"><img src={project.authorAvatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(project.authorId)}`} alt="" className="h-7 w-7 rounded-full" /><span className={`truncate text-xs ${muted}`}>{project.authorName}</span></div><div className="flex items-center gap-2"><span className={`text-xs ${muted}`}>{Object.keys(project.likedBy ?? {}).length} likes · {Object.keys(project.comments ?? {}).length} comments</span><button type="button" aria-label={project.savedBy?.[viewer?.id ?? ""] ? "Remove bookmark" : "Bookmark project"} onClick={() => void toggleBookmark(project)} className="rounded-full p-1 hover:bg-sky-400/10"><Bookmark className={`h-4 w-4 ${project.savedBy?.[viewer?.id ?? ""] ? "fill-sky-400 text-sky-400" : ""}`} /></button></div></div><p className={`mt-2 text-xs ${muted}`}>Published {formatProjectDate(project.createdAt)}{project.hackathonName ? ` · ${project.hackathonName}` : ""}</p><Link href={`/hackathon/project/${project.id}`} className="mt-3 flex items-center justify-between rounded-xl bg-sky-400 px-3 py-2.5 text-sm font-bold text-slate-950">View project <ArrowUpRight className="h-4 w-4" /></Link></div></article>)}</div> : <div className={`rounded-2xl border p-10 text-center ${card}`}><BookOpen className="mx-auto h-9 w-9 text-sky-500" /><h3 className="mt-3 font-bold">{myProjects ? "Your portfolio starts here" : "No projects match yet"}</h3><p className={`mt-1 text-sm ${muted}`}>{myProjects ? "Publish a project to show your work." : "Try another search or category."}</p></div>}
          {visible.length > visibleCount && <button type="button" onClick={() => setVisibleCount((count) => count + 12)} className="mx-auto block rounded-full border border-sky-400/30 px-5 py-2.5 text-sm font-bold text-sky-500">Load more projects</button>}
          {!loading && !visible.length && !search && category === "All categories" && technology === "All technologies" && <button type="button" onClick={() => setShowPublish(true)} className="mx-auto block rounded-full bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950">Publish a project</button>}
        </> : <>
          <div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Public servers</h2><p className={`mt-1 text-sm ${muted}`}>A space for students to build together.</p></div><button onClick={() => setShowServerForm(true)} className="rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950">Create server</button></div>
          {showServerForm && <form onSubmit={createServer} className={`space-y-3 rounded-2xl border p-5 ${card}`}><div className="flex items-center justify-between"><h3 className="font-bold">New server</h3><button type="button" aria-label="Close server form" onClick={() => setShowServerForm(false)}><X className="h-4 w-4" /></button></div><input required maxLength={80} className={input} placeholder="Server name" value={serverForm.name} onChange={(event) => setServerForm({ ...serverForm, name: event.target.value })} /><input required maxLength={80} className={input} placeholder="Topic or domain" value={serverForm.domain} onChange={(event) => setServerForm({ ...serverForm, domain: event.target.value })} /><textarea required maxLength={500} rows={3} className={input} placeholder="What will students discuss here?" value={serverForm.details} onChange={(event) => setServerForm({ ...serverForm, details: event.target.value })} /><button disabled={busy} className="rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Creating…" : "Create server"}</button></form>}
          <div className="grid gap-3 sm:grid-cols-2">{servers.map((server) => <button key={server.id} onClick={() => setSelectedServer(server.id)} className={`rounded-2xl border p-5 text-left transition hover:border-sky-400 ${card}`}><span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-500">{server.domain}</span><h3 className="mt-3 text-lg font-bold">{server.name}</h3><p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{server.details}</p><p className="mt-3 text-xs text-sky-500">{Object.keys(server.members ?? {}).length} members • Open conversation →</p></button>)}</div>
          {!servers.length && <div className={`rounded-2xl border p-10 text-center ${card}`}><Users className="mx-auto text-sky-500" /><h3 className="mt-3 font-bold">No public servers yet</h3><p className={`mt-1 text-sm ${muted}`}>Start a place to build with other students.</p></div>}
          {selected && <section className={`rounded-2xl border p-5 ${card}`}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-sky-500">{selected.domain}</p><h3 className="mt-1 text-xl font-bold">{selected.name}</h3><p className={`mt-1 text-sm ${muted}`}>{selected.details}</p></div><button aria-label="Close server" onClick={() => setSelectedServer("")}><X className="h-4 w-4" /></button></div>{viewer && !selected.members?.[viewer.id] && <button onClick={() => void joinServer(selected)} className="mt-4 rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950">Join server</button>}<div className={`mt-5 max-h-72 space-y-3 overflow-y-auto rounded-xl p-4 ${dark ? "bg-[#0c1425]" : "bg-slate-50"}`}>{Object.entries(selected.messages ?? {}).sort((a, b) => a[1].createdAt - b[1].createdAt).map(([id, item]) => <div key={id}><p className="text-xs font-bold text-sky-500">{item.authorName} <span className={muted}>· {formatProjectDate(item.createdAt)}</span></p><p className="mt-1 break-words text-sm">{item.text}</p></div>)}{!selected.messages && <p className={`text-sm ${muted}`}>No messages yet. Start the conversation.</p>}</div><form onSubmit={sendMessage} className="mt-3 flex gap-2"><input maxLength={1000} className={input} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={viewer ? "Write a message" : "Sign in to chat"} /><button disabled={!viewer || !selected.members?.[viewer.id] || !message.trim()} aria-label="Send message" className="rounded-xl bg-sky-400 px-4 text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" /></button></form></section>}
        </>}
      </div>
      <aside className="space-y-4"><AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} /><div className={`rounded-2xl border p-5 ${card}`}><p className="text-xs font-bold uppercase tracking-[.16em] text-sky-500">Recently published</p><div className="mt-4 space-y-3">{[...projects].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4).map((project) => <Link key={project.id} href={`/hackathon/project/${project.id}`} className="block border-b border-slate-500/15 pb-3 last:border-0 last:pb-0"><p className="line-clamp-1 text-sm font-semibold">{project.title}</p><p className={`mt-0.5 text-xs ${muted}`}>{project.authorName} · {formatProjectDate(project.createdAt)}</p></Link>)}{!projects.length && <p className={`text-sm ${muted}`}>New projects will appear here.</p>}</div></div><Link href="/team-finder" className="block rounded-2xl bg-gradient-to-br from-[#102943] to-[#24375b] p-5 text-white"><Users className="h-7 w-7 text-sky-300" /><h3 className="mt-4 text-lg font-bold">Find your people</h3><p className="mt-1 text-sm text-slate-300">Meet students who want to build the next big thing with you.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sky-300">Explore teams <ArrowRight className="h-4 w-4" /></span></Link></aside>
    </div>
  </main>;
}
