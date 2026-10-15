"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { ArrowLeft, Bookmark, ExternalLink, Flag, Github, Heart, Loader2, MessageCircle, Pencil, Share2, Trash2 } from "lucide-react";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import { useLumiMode } from "@/components/LumiModeContext";
import { realtimeDb } from "@/lib/firebase";
import { formatProjectDate, HackathonProject, isSafeUrl, PROJECT_CATEGORIES } from "@/lib/hackathon";
import { isDisplayableImageSource } from "@/lib/media";

export default function HackathonProjectDetails({ projectId }: { projectId: string }) {
  const { isFocusMode } = useLumiMode();
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [project, setProject] = useState<HackathonProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState({ title: "", tagline: "", description: "", category: "Other", technologies: "" });
  const dark = !isFocusMode;
  const card = dark ? "border-white/10 bg-[#131a2a] text-white" : "border-slate-200 bg-white text-slate-950";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const input = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-sky-400 ${dark ? "border-white/10 bg-[#0d1422] text-white" : "border-slate-200 bg-white text-slate-950"}`;

  useEffect(() => onValue(ref(realtimeDb, `hackathon/projects/${projectId}`), (snapshot: { val: () => Omit<HackathonProject, "id"> | null }) => {
    const value = snapshot.val();
    setProject(value ? { id: projectId, ...value } : null);
    setLoading(false);
    if (value) setEdit({ title: value.title, tagline: value.tagline ?? "", description: value.description, category: value.category ?? "Other", technologies: (value.technologies ?? []).join(", ") });
  }, () => { setLoading(false); setError("Project details are unavailable until the Lumi database is available."); }), [projectId]);

  async function toggle(path: "likedBy" | "savedBy") {
    if (!viewer || !project) { setError("Sign in to interact with projects."); return; }
    try { await set(ref(realtimeDb, `hackathon/projects/${project.id}/${path}/${viewer.id}`), project[path]?.[viewer.id] ? null : true); setError(""); }
    catch { setError("Could not save your choice. Try again."); }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || !project || !comment.trim()) { setError("Sign in and write a comment first."); return; }
    try { await set(push(ref(realtimeDb, `hackathon/projects/${project.id}/comments`)), { authorId: viewer.id, authorName: viewer.name, body: comment.trim().slice(0, 1000), createdAt: Date.now() }); setComment(""); setStatus("Comment added."); }
    catch { setError("Comment could not be posted."); }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || !project || viewer.id !== project.authorId) return;
    if (!edit.title.trim() || !edit.tagline.trim() || !edit.description.trim()) { setError("Title, short description, and details are required."); return; }
    setBusy(true);
    try { await update(ref(realtimeDb, `hackathon/projects/${project.id}`), { title: edit.title.trim(), tagline: edit.tagline.trim(), description: edit.description.trim(), category: edit.category, technologies: edit.technologies.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 10) }); setEditing(false); setStatus("Project updated."); setError(""); }
    catch { setError("Changes could not be saved."); }
    finally { setBusy(false); }
  }

  async function deleteProject() {
    if (!project || !viewer || viewer.id !== project.authorId || !window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    try { await remove(ref(realtimeDb, `hackathon/projects/${project.id}`)); window.location.assign("/hackathon"); }
    catch { setError("Project could not be deleted."); }
  }

  async function shareProject() {
    try { await navigator.clipboard.writeText(window.location.href); setStatus("Project link copied."); }
    catch { setError("Could not copy the link."); }
  }

  async function reportProject() {
    if (!viewer || !project) { setError("Sign in to report a project."); return; }
    if (!window.confirm("Report this project for inappropriate content or spam?")) return;
    try { await set(ref(realtimeDb, `hackathon/reports/${project.id}/${viewer.id}`), { reporterId: viewer.id, createdAt: Date.now(), reason: "inappropriate-or-spam" }); setStatus("Report received."); }
    catch { setError("Report could not be sent."); }
  }

  return <main className="space-y-5 pb-10"><Link href="/hackathon" className={`inline-flex items-center gap-2 text-sm font-semibold ${muted}`}><ArrowLeft className="h-4 w-4" /> Back to projects</Link>
    {error && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
    {status && <p role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{status}</p>}
    {loading ? <div className={`rounded-2xl border p-10 ${card}`}><Loader2 className="mx-auto animate-spin text-sky-500" /></div> : !project ? <div className={`rounded-2xl border p-10 text-center ${card}`}><h1 className="text-xl font-bold">Project unavailable</h1><p className={`mt-2 text-sm ${muted}`}>It may have been removed, or the database may be offline.</p></div> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0 space-y-5"><article className={`overflow-hidden rounded-[26px] border ${card}`}><div className="flex min-h-56 items-center justify-center bg-gradient-to-br from-[#1a3653] to-[#49346b]">{isDisplayableImageSource(project.imageUrls?.[0] ?? "") ? <img src={project.imageUrls?.[0]} alt={`${project.title} thumbnail`} className="max-h-[420px] w-full object-cover" /> : <span className="px-6 text-center text-3xl font-bold uppercase tracking-wide text-white">{project.title}</span>}</div><div className="p-5 sm:p-7"><span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-500">{project.category || "Student project"}</span><h1 className="mt-4 text-3xl font-bold tracking-tight">{project.title}</h1><p className={`mt-2 text-base ${muted}`}>{project.tagline || project.description}</p><div className={`mt-5 flex flex-wrap items-center gap-3 border-y py-4 ${dark ? "border-white/10" : "border-slate-100"}`}><Link href={`/profile/${project.authorId}`} className="flex items-center gap-2"><img src={project.authorAvatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(project.authorId)}`} alt="" className="h-9 w-9 rounded-full" /><span className="text-sm font-semibold">{project.authorName}</span></Link><span className={`text-xs ${muted}`}>Published {formatProjectDate(project.createdAt)}</span>{project.hackathonName && <span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs text-violet-500">{project.hackathonName}</span>}</div><div className="mt-5 flex flex-wrap gap-2">{project.technologies?.map((tech) => <span key={tech} className={`rounded-full px-2.5 py-1 text-xs ${dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{tech}</span>)}</div><h2 className="mt-7 text-lg font-bold">About this project</h2><p className={`mt-2 whitespace-pre-wrap leading-7 ${muted}`}>{project.description}</p>{Boolean(project.teamMembers?.length) && <><h2 className="mt-7 text-lg font-bold">Team</h2><p className={`mt-2 text-sm ${muted}`}>{project.teamMembers?.join(" · ")}</p></>}{project.imageUrls && project.imageUrls.length > 1 && <div className="mt-6 grid gap-3 sm:grid-cols-2">{project.imageUrls.slice(1).filter((url) => isDisplayableImageSource(url)).map((url, index) => <img key={url} src={url} alt={`${project.title} screenshot ${index + 2}`} className="w-full rounded-xl object-cover" />)}</div>}<div className="mt-7 flex flex-wrap gap-2">{isSafeUrl(project.websiteUrl) && <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-4 py-2.5 text-sm font-bold text-slate-950"><ExternalLink className="h-4 w-4" /> Live website</a>}{isSafeUrl(project.githubUrl, true) && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold ${dark ? "border-white/15" : "border-slate-200"}`}><Github className="h-4 w-4" /> GitHub</a>}{project.videoUrl && isSafeUrl(project.videoUrl) && <a href={project.videoUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold ${dark ? "border-white/15" : "border-slate-200"}`}>Watch demo ↗</a>}</div><div className={`mt-6 flex flex-wrap gap-2 border-t pt-5 ${dark ? "border-white/10" : "border-slate-100"}`}><button onClick={() => void toggle("likedBy")} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${project.likedBy?.[viewer?.id ?? ""] ? "bg-rose-500/15 text-rose-500" : dark ? "bg-white/10" : "bg-slate-100"}`}><Heart className="h-4 w-4" /> {Object.keys(project.likedBy ?? {}).length} Likes</button><button onClick={() => void toggle("savedBy")} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${project.savedBy?.[viewer?.id ?? ""] ? "bg-sky-400/15 text-sky-500" : dark ? "bg-white/10" : "bg-slate-100"}`}><Bookmark className="h-4 w-4" /> Save</button><button onClick={() => void shareProject()} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${dark ? "bg-white/10" : "bg-slate-100"}`}><Share2 className="h-4 w-4" /> Share</button><button onClick={() => void reportProject()} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${dark ? "bg-white/10" : "bg-slate-100"}`}><Flag className="h-4 w-4" /> Report</button></div></div></article>
      {viewer?.id === project.authorId && <section className={`rounded-2xl border p-5 ${card}`}><div className="flex items-center justify-between"><h2 className="font-bold">Manage your project</h2><div className="flex gap-2"><button onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-1 text-sm text-sky-500"><Pencil className="h-4 w-4" /> Edit</button><button onClick={() => void deleteProject()} className="inline-flex items-center gap-1 text-sm text-rose-500"><Trash2 className="h-4 w-4" /> Delete</button></div></div>{editing && <form onSubmit={saveEdit} className="mt-4 grid gap-3 sm:grid-cols-2"><input required maxLength={100} aria-label="Project title" className={input} value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} /><select aria-label="Project category" className={input} value={edit.category} onChange={(event) => setEdit({ ...edit, category: event.target.value })}>{PROJECT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><input required maxLength={160} aria-label="Short description" className={`sm:col-span-2 ${input}`} value={edit.tagline} onChange={(event) => setEdit({ ...edit, tagline: event.target.value })} /><input maxLength={250} aria-label="Technologies" className={`sm:col-span-2 ${input}`} value={edit.technologies} onChange={(event) => setEdit({ ...edit, technologies: event.target.value })} /><textarea required rows={4} maxLength={3000} aria-label="Detailed description" className={`sm:col-span-2 ${input}`} value={edit.description} onChange={(event) => setEdit({ ...edit, description: event.target.value })} /><button disabled={busy} className="rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">Save changes</button></form>}</section>}
      <section className={`rounded-2xl border p-5 ${card}`}><h2 className="flex items-center gap-2 text-lg font-bold"><MessageCircle className="h-5 w-5 text-sky-500" /> Comments · {Object.keys(project.comments ?? {}).length}</h2><div className="mt-4 space-y-4">{Object.entries(project.comments ?? {}).sort((a, b) => a[1].createdAt - b[1].createdAt).map(([id, item]) => <div key={id} className={`border-b pb-3 last:border-0 ${dark ? "border-white/10" : "border-slate-100"}`}><p className="text-sm font-bold">{item.authorName} <span className={`text-xs font-normal ${muted}`}>· {formatProjectDate(item.createdAt)}</span></p><p className={`mt-1 whitespace-pre-wrap text-sm ${muted}`}>{item.body}</p></div>)}{!project.comments && <p className={`text-sm ${muted}`}>No comments yet. Start the conversation.</p>}</div><form onSubmit={submitComment} className="mt-5 flex gap-2"><input maxLength={1000} className={input} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={viewer ? "Write a thoughtful comment" : "Sign in to comment"} /><button disabled={!viewer || !comment.trim()} className="rounded-xl bg-sky-400 px-4 text-sm font-bold text-slate-950 disabled:opacity-50">Post</button></form></section></div><aside><AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} /></aside></div>}
  </main>;
}
