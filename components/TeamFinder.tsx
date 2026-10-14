"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onValue, push, ref, set } from "firebase/database";
import { ArrowLeft, ArrowRight, Check, Clock3, Loader2, Plus, Search, Send, Users, X } from "lucide-react";
import AuthPanel, { LumiViewer } from "@/components/AuthPanel";
import { useLumiMode } from "@/components/LumiModeContext";
import { realtimeDb } from "@/lib/firebase";

type DiscoverableStudent = { id: string; name: string; avatar: string; bio: string; skills: string[]; interests: string[]; role: string; level: string; availability: string };
type Team = { id: string; ownerId: string; ownerName: string; name: string; description: string; idea: string; hackathonName: string; skills: string[]; roles: string[]; maxMembers: number; recruiting: boolean; createdAt: number; members?: Record<string, true> };
type JoinRequest = { userId: string; name: string; message: string; status: "pending" | "accepted" | "rejected"; createdAt: number };

export default function TeamFinder() {
  const { isFocusMode } = useLumiMode();
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<DiscoverableStudent[]>([]);
  const [requests, setRequests] = useState<Record<string, JoinRequest>>({});
  const [tab, setTab] = useState<"teams" | "students" | "mine">("teams");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTeam, setActiveTeam] = useState("");
  const [intro, setIntro] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [teamForm, setTeamForm] = useState({ name: "", description: "", idea: "", hackathonName: "", skills: "", roles: "", maxMembers: 4 });
  const [profileForm, setProfileForm] = useState({ bio: "", skills: "", interests: "", role: "", level: "Beginner", availability: "Open to collaborate" });
  const dark = !isFocusMode;
  const card = dark ? "border-white/10 bg-[#131a2a] text-white" : "border-slate-200 bg-white text-slate-950";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const input = `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 ${dark ? "border-white/10 bg-[#0d1422] text-white" : "border-slate-200 bg-white text-slate-950"}`;
  const selected = teams.find((team) => team.id === activeTeam);

  useEffect(() => {
    const unsubscribeTeams = onValue(ref(realtimeDb, "hackathon/teams"), (snapshot: { val: () => Record<string, Omit<Team, "id">> | null }) => {
      setTeams(Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({ id, ...value })).sort((a, b) => b.createdAt - a.createdAt).slice(0, 60)); setLoading(false);
    }, () => { setLoading(false); setError("Teams cannot load until the Lumi database is available."); });
    const unsubscribeStudents = onValue(ref(realtimeDb, "hackathon/discoverableStudents"), (snapshot: { val: () => Record<string, Omit<DiscoverableStudent, "id">> | null }) => {
      setStudents(Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({ id, ...value })).slice(0, 80));
    }, () => setError("Student cards cannot load until the Lumi database is available."));
    return () => { unsubscribeTeams(); unsubscribeStudents(); };
  }, []);

  useEffect(() => {
    if (!selected || !viewer) { setRequests({}); return; }
    const path = selected.ownerId === viewer.id ? `hackathon/teamRequests/${selected.id}` : `hackathon/teamRequests/${selected.id}/${viewer.id}`;
    return onValue(ref(realtimeDb, path), (snapshot: { val: () => Record<string, JoinRequest> | JoinRequest | null }) => {
      const value = snapshot.val();
      setRequests(selected.ownerId === viewer.id ? value as Record<string, JoinRequest> ?? {} : value ? { [viewer.id]: value as JoinRequest } : {});
    }, () => setRequests({}));
  }, [selected?.id, selected?.ownerId, viewer?.id]);

  const visibleTeams = useMemo(() => teams.filter((team) => {
    if (tab === "mine" && (!viewer || !team.members?.[viewer.id])) return false;
    const term = search.trim().toLowerCase();
    return !term || [team.name, team.description, team.idea, team.hackathonName, ...team.skills, ...team.roles].join(" ").toLowerCase().includes(term);
  }), [teams, tab, viewer?.id, search]);
  const visibleStudents = useMemo(() => students.filter((student) => {
    const term = search.trim().toLowerCase();
    return !term || [student.name, student.bio, student.role, student.level, student.availability, ...student.skills, ...student.interests].join(" ").toLowerCase().includes(term);
  }), [students, search]);

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!viewer) { setError("Sign in to create a team."); return; }
    if (!teamForm.name.trim() || !teamForm.description.trim() || !teamForm.idea.trim()) { setError("Add a name, description, and project idea."); return; }
    setBusy(true); setError("");
    try {
      const next = push(ref(realtimeDb, "hackathon/teams"));
      await set(next, { ownerId: viewer.id, ownerName: viewer.name, name: teamForm.name.trim(), description: teamForm.description.trim(), idea: teamForm.idea.trim(), hackathonName: teamForm.hackathonName.trim(), skills: teamForm.skills.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 10), roles: teamForm.roles.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 8), maxMembers: teamForm.maxMembers, recruiting: true, createdAt: Date.now(), members: { [viewer.id]: true } });
      setTeamForm({ name: "", description: "", idea: "", hackathonName: "", skills: "", roles: "", maxMembers: 4 }); setShowCreate(false); setSuccess("Team created.");
    } catch { setError("Team could not be created. Check the Lumi database connection."); }
    finally { setBusy(false); }
  }

  async function publishProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer) { setError("Sign in to make your card discoverable."); return; }
    if (!profileForm.bio.trim() || !profileForm.role.trim()) { setError("Add a short bio and preferred role."); return; }
    setBusy(true);
    try { await set(ref(realtimeDb, `hackathon/discoverableStudents/${viewer.id}`), { name: viewer.name, avatar: viewer.avatar, bio: profileForm.bio.trim(), skills: profileForm.skills.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 12), interests: profileForm.interests.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 8), role: profileForm.role.trim(), level: profileForm.level, availability: profileForm.availability }); setShowProfile(false); setSuccess("Your student card is now discoverable."); setError(""); }
    catch { setError("Your student card could not be saved."); }
    finally { setBusy(false); }
  }

  async function requestJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!viewer || !selected || selected.ownerId === viewer.id) return;
    setBusy(true);
    try { await set(ref(realtimeDb, `hackathon/teamRequests/${selected.id}/${viewer.id}`), { userId: viewer.id, name: viewer.name, message: intro.trim().slice(0, 500), status: "pending", createdAt: Date.now() }); setIntro(""); setSuccess("Join request sent to the team leader."); setError(""); }
    catch { setError("Join request could not be sent, or you already have a request pending."); }
    finally { setBusy(false); }
  }

  async function decideRequest(userId: string, action: "accepted" | "rejected") {
    if (!viewer || !selected || selected.ownerId !== viewer.id) return;
    if (action === "accepted" && Object.keys(selected.members ?? {}).length >= selected.maxMembers) { setError("This team is full."); return; }
    try {
      if (action === "accepted") await set(ref(realtimeDb, `hackathon/teams/${selected.id}/members/${userId}`), true);
      await set(ref(realtimeDb, `hackathon/teamRequests/${selected.id}/${userId}/status`), action);
      setSuccess(`Request ${action}.`); setError("");
    } catch { setError("Could not update the join request."); }
  }

  async function leaveTeam(team: Team) {
    if (!viewer || team.ownerId === viewer.id || !window.confirm(`Leave ${team.name}?`)) return;
    try { await set(ref(realtimeDb, `hackathon/teams/${team.id}/members/${viewer.id}`), null); setSuccess(`Left ${team.name}.`); }
    catch { setError("Could not leave the team."); }
  }

  async function toggleRecruiting(team: Team) {
    if (!viewer || team.ownerId !== viewer.id) return;
    try { await set(ref(realtimeDb, `hackathon/teams/${team.id}/recruiting`), !team.recruiting); setSuccess(!team.recruiting ? "Recruitment opened." : "Recruitment closed."); }
    catch { setError("Could not update recruitment."); }
  }

  return <main className="space-y-5 pb-10"><Link href="/hackathon" className={`inline-flex items-center gap-2 text-sm font-semibold ${muted}`}><ArrowLeft className="h-4 w-4" /> Hackathon showcase</Link><header className="rounded-[28px] bg-gradient-to-br from-[#0c1425] via-[#172a43] to-[#25476e] p-7 text-white sm:p-9"><span className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Lumi Team Finder</span><div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-bold sm:text-4xl">Build with the right people.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Find collaborators, share your skills, and form a team for your next hackathon.</p></div><button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-bold text-slate-950"><Plus className="h-4 w-4" /> Create a team</button></div></header>
    <nav aria-label="Team Finder sections" className={`grid grid-cols-3 gap-1 rounded-2xl border p-1.5 ${card}`}>{(["teams", "students", "mine"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-2 py-2.5 text-sm font-semibold ${tab === item ? "bg-sky-400 text-slate-950" : muted}`}>{item === "teams" ? "Discover teams" : item === "students" ? "Find teammates" : "My teams"}</button>)}</nav>
    {error && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}{success && <p role="status" className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{success}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_285px]"><div className="min-w-0 space-y-5"><div className="relative"><Search className={`absolute left-3 top-3 h-4 w-4 ${muted}`} /><input aria-label="Search teams and students" value={search} onChange={(event) => setSearch(event.target.value)} className={`${input} pl-9`} placeholder={tab === "students" ? "Search skills, roles, interests" : "Search teams, roles, technologies"} /></div>
      {showCreate && <form onSubmit={createTeam} className={`grid gap-3 rounded-2xl border p-5 sm:grid-cols-2 ${card}`}><div className="sm:col-span-2 flex justify-between"><h2 className="text-xl font-bold">Create a public team</h2><button type="button" aria-label="Close team form" onClick={() => setShowCreate(false)}><X className="h-5 w-5" /></button></div><input required maxLength={80} aria-label="Team name" className={input} placeholder="Team name" value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} /><input maxLength={100} aria-label="Hackathon name" className={input} placeholder="Hackathon name (optional)" value={teamForm.hackathonName} onChange={(event) => setTeamForm({ ...teamForm, hackathonName: event.target.value })} /><textarea required rows={3} maxLength={500} aria-label="Team description" className={`sm:col-span-2 ${input}`} placeholder="What is your team about?" value={teamForm.description} onChange={(event) => setTeamForm({ ...teamForm, description: event.target.value })} /><input required maxLength={200} aria-label="Project idea" className={`sm:col-span-2 ${input}`} placeholder="Project idea" value={teamForm.idea} onChange={(event) => setTeamForm({ ...teamForm, idea: event.target.value })} /><input maxLength={250} aria-label="Required skills" className={input} placeholder="Required skills, separated by commas" value={teamForm.skills} onChange={(event) => setTeamForm({ ...teamForm, skills: event.target.value })} /><input maxLength={250} aria-label="Open roles" className={input} placeholder="Open roles, separated by commas" value={teamForm.roles} onChange={(event) => setTeamForm({ ...teamForm, roles: event.target.value })} /><label className="text-sm">Maximum members<input type="number" min={2} max={12} className={`mt-1 ${input}`} value={teamForm.maxMembers} onChange={(event) => setTeamForm({ ...teamForm, maxMembers: Number(event.target.value) })} /></label><div className="sm:col-span-2"><button disabled={busy} className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Creating…" : "Create team"}</button></div></form>}
      {showProfile && <form onSubmit={publishProfile} className={`grid gap-3 rounded-2xl border p-5 sm:grid-cols-2 ${card}`}><div className="sm:col-span-2 flex justify-between"><div><h2 className="text-xl font-bold">Your discoverable card</h2><p className={`mt-1 text-xs ${muted}`}>Only details entered here are shown in Team Finder.</p></div><button type="button" aria-label="Close profile form" onClick={() => setShowProfile(false)}><X className="h-5 w-5" /></button></div><textarea required maxLength={300} rows={3} aria-label="Short bio" className={`sm:col-span-2 ${input}`} placeholder="Short bio" value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} /><input maxLength={250} aria-label="Technical skills" className={input} placeholder="Technical skills, separated by commas" value={profileForm.skills} onChange={(event) => setProfileForm({ ...profileForm, skills: event.target.value })} /><input maxLength={200} aria-label="Project interests" className={input} placeholder="Interests, separated by commas" value={profileForm.interests} onChange={(event) => setProfileForm({ ...profileForm, interests: event.target.value })} /><input required maxLength={80} aria-label="Preferred role" className={input} placeholder="Preferred role" value={profileForm.role} onChange={(event) => setProfileForm({ ...profileForm, role: event.target.value })} /><select aria-label="Experience level" className={input} value={profileForm.level} onChange={(event) => setProfileForm({ ...profileForm, level: event.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><select aria-label="Availability" className={input} value={profileForm.availability} onChange={(event) => setProfileForm({ ...profileForm, availability: event.target.value })}><option>Open to collaborate</option><option>Available on weekends</option><option>Not available right now</option></select><div className="sm:col-span-2"><button disabled={busy} className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">Save discoverable card</button></div></form>}
      {tab === "students" ? <><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold">Student builders</h2><p className={`mt-1 text-sm ${muted}`}>Only students who opted in appear here.</p></div><button onClick={() => setShowProfile(true)} className="text-sm font-bold text-sky-500">{students.some((student) => student.id === viewer?.id) ? "Edit my card" : "Make me discoverable"}</button></div><div className="grid gap-3 sm:grid-cols-2">{visibleStudents.map((student) => <article key={student.id} className={`rounded-2xl border p-5 ${card}`}><div className="flex items-center gap-3"><img src={student.avatar} alt="" className="h-12 w-12 rounded-full" /><div><Link href={`/profile/${student.id}`} className="font-bold hover:text-sky-500">{student.name}</Link><p className={`text-xs ${muted}`}>{student.role} · {student.level}</p></div></div><p className={`mt-3 line-clamp-3 text-sm ${muted}`}>{student.bio}</p><div className="mt-3 flex flex-wrap gap-1">{student.skills.map((skill) => <span key={skill} className="rounded-full bg-sky-400/10 px-2 py-1 text-xs text-sky-500">{skill}</span>)}</div><p className={`mt-3 text-xs ${muted}`}>{student.availability}</p></article>)}</div>{!visibleStudents.length && <div className={`rounded-2xl border p-9 text-center ${card}`}><Users className="mx-auto text-sky-500" /><h3 className="mt-3 font-bold">No matching students yet</h3><p className={`mt-1 text-sm ${muted}`}>Try another skill or publish your card.</p></div>}</> : <><div><h2 className="text-xl font-bold">{tab === "mine" ? "My teams" : "Teams looking for builders"}</h2><p className={`mt-1 text-sm ${muted}`}>Find a project idea that excites you.</p></div>{loading ? <div className={`rounded-2xl border p-9 ${card}`}><Loader2 className="mx-auto animate-spin text-sky-500" /></div> : <div className="grid gap-3 sm:grid-cols-2">{visibleTeams.map((team) => <button key={team.id} onClick={() => setActiveTeam(team.id)} className={`rounded-2xl border p-5 text-left transition hover:border-sky-400 ${card}`}><div className="flex justify-between gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${team.recruiting ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"}`}>{team.recruiting ? "Recruiting" : "Closed"}</span><span className={`text-xs ${muted}`}>{Object.keys(team.members ?? {}).length}/{team.maxMembers} members</span></div><h3 className="mt-3 text-lg font-bold">{team.name}</h3><p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{team.idea}</p><div className="mt-3 flex flex-wrap gap-1">{team.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-sky-400/10 px-2 py-1 text-xs text-sky-500">{skill}</span>)}</div><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-500">View team <ArrowRight className="h-3 w-3" /></span></button>)}</div>}{!visibleTeams.length && !loading && <div className={`rounded-2xl border p-9 text-center ${card}`}><Users className="mx-auto text-sky-500" /><h3 className="mt-3 font-bold">{tab === "mine" ? "You have no teams yet" : "No teams match yet"}</h3><p className={`mt-1 text-sm ${muted}`}>Create a team or try another search.</p></div>}</>}
      {selected && <section className={`rounded-2xl border p-5 ${card}`}><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold text-sky-500">{selected.hackathonName || "Student team"}</p><h2 className="mt-1 text-xl font-bold">{selected.name}</h2><p className={`mt-1 text-sm ${muted}`}>Led by {selected.ownerName}</p></div><button aria-label="Close team" onClick={() => setActiveTeam("")}><X className="h-5 w-5" /></button></div><p className={`mt-4 text-sm leading-6 ${muted}`}>{selected.description}</p><p className="mt-3 text-sm font-semibold">Idea: {selected.idea}</p><p className={`mt-3 text-xs ${muted}`}>Open roles: {selected.roles.join(", ") || "Open to all skills"}</p><p className={`mt-2 text-xs ${muted}`}>Members: {Object.keys(selected.members ?? {}).length} of {selected.maxMembers}</p>{viewer?.id === selected.ownerId ? <div className="mt-5"><button onClick={() => void toggleRecruiting(selected)} className="rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950">{selected.recruiting ? "Close recruitment" : "Reopen recruitment"}</button><h3 className="mt-5 font-bold">Join requests</h3><div className="mt-2 space-y-3">{Object.entries(requests).map(([uid, request]) => <div key={uid} className={`rounded-xl border p-3 ${dark ? "border-white/10" : "border-slate-200"}`}><p className="text-sm font-semibold">{request.name} <span className={`text-xs font-normal ${muted}`}>· {request.status}</span></p><p className={`mt-1 text-sm ${muted}`}>{request.message || "No introduction added."}</p>{request.status === "pending" && <div className="mt-2 flex gap-3"><button onClick={() => void decideRequest(uid, "accepted")} className="text-sm font-bold text-emerald-500">Accept</button><button onClick={() => void decideRequest(uid, "rejected")} className="text-sm font-bold text-rose-500">Reject</button></div>}</div>)}{!Object.keys(requests).length && <p className={`text-sm ${muted}`}>No requests yet.</p>}</div></div> : viewer && selected.members?.[viewer.id] ? <button onClick={() => void leaveTeam(selected)} className="mt-4 text-sm font-bold text-rose-500">Leave team</button> : viewer && requests[viewer.id] ? <p className="mt-4 inline-flex items-center gap-2 text-sm text-sky-500"><Clock3 className="h-4 w-4" /> Request {requests[viewer.id].status}</p> : selected.recruiting && Object.keys(selected.members ?? {}).length < selected.maxMembers ? <form onSubmit={requestJoin} className="mt-5 space-y-2"><textarea maxLength={500} rows={2} className={input} value={intro} onChange={(event) => setIntro(event.target.value)} placeholder="Introduce yourself (optional)" /><button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" /> Request to join</button></form> : <p className={`mt-4 text-sm ${muted}`}>{viewer ? "This team is not accepting requests." : "Sign in to request to join."}</p>}</section>}
      </div><aside className="space-y-4"><AuthPanel isFocusMode={isFocusMode} onViewerChange={setViewer} /><div className={`rounded-2xl border p-5 ${card}`}><h3 className="font-bold">How it works</h3><ol className={`mt-3 space-y-3 text-sm ${muted}`}><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-sky-500" /> Make your student card discoverable.</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-sky-500" /> Find an open team or start one.</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-sky-500" /> Send a request and build together.</li></ol></div></aside></div>
  </main>;
}
