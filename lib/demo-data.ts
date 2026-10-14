// This store is intentionally separate from Firebase. It is fictional, per-browser demo data.
export type DemoUser = { id: string; name: string; username: string; bio: string; skills: string[]; interests: string[] };
export type DemoDiscussion = { id: string; authorId: string; body: string; createdAt: number; kind: "discussion" | "announcement" };
export type DemoServer = { id: string; name: string; description: string; category: string; rules: string; visibility: "public" | "private"; ownerId: string; moderatorIds: string[]; memberIds: string[]; requestIds: string[]; discussions: DemoDiscussion[]; createdAt: number };
export type DemoTeam = { id: string; name: string; description: string; idea: string; hackathon: string; skills: string[]; roles: string[]; ownerId: string; memberIds: string[]; requestIds: string[]; capacity: number; recruiting: boolean };
export type DemoProject = { id: string; title: string; description: string; websiteUrl: string; githubUrl: string; ownerId: string; topic: string };
export type DemoState = { version: 1; users: DemoUser[]; servers: DemoServer[]; teams: DemoTeam[]; projects: DemoProject[] };

export const DEMO_KEY = "lumi:demo:v1";
export const demoSeed: DemoState = {
  version: 1,
  users: [
    { id: "raj-demo", name: "Raj Demo", username: "@raj_demo", bio: "Student builder exploring useful AI tools and web apps.", skills: ["React", "Python", "AI"], interests: ["Artificial Intelligence", "Web Development"] },
    { id: "priya-demo", name: "Priya Demo", username: "@priya_demo", bio: "I build mobile experiences for student communities.", skills: ["Flutter", "Firebase", "Dart"], interests: ["Mobile Development"] },
    { id: "arun-demo", name: "Arun Demo", username: "@arun_demo", bio: "Machine learning enthusiast turning experiments into projects.", skills: ["Python", "TensorFlow", "Data Science"], interests: ["Artificial Intelligence", "Data Science"] },
    { id: "kavin-demo", name: "Kavin Demo", username: "@kavin_demo", bio: "Backend developer who likes robust APIs and open source.", skills: ["Java", "Spring Boot", "PostgreSQL"], interests: ["Open Source", "Cloud Computing"] },
    { id: "nisha-demo", name: "Nisha Demo", username: "@nisha_demo", bio: "Learning network security and building safer developer tools.", skills: ["Python", "Networking", "Cybersecurity"], interests: ["Cybersecurity", "Internet of Things"] }
  ],
  servers: [
    { id: "ai-builders", name: "AI Builders Lab", description: "Share experiments, ask questions, and build responsible AI projects together.", category: "Artificial Intelligence", rules: "Be kind. Credit your sources. Share what you learned.", visibility: "public", ownerId: "raj-demo", moderatorIds: [], memberIds: ["raj-demo", "arun-demo"], requestIds: [], discussions: [{ id: "d1", authorId: "raj-demo", body: "Welcome! What are you building this semester?", createdAt: 1760400000000, kind: "announcement" }], createdAt: 1760300000000 },
    { id: "mobile-makers", name: "Mobile Makers", description: "Flutter and mobile app projects for students.", category: "Mobile Development", rules: "Keep feedback constructive.", visibility: "public", ownerId: "priya-demo", moderatorIds: [], memberIds: ["priya-demo"], requestIds: [], discussions: [], createdAt: 1760310000000 },
    { id: "secure-code", name: "Secure Code Circle", description: "Practice cybersecurity fundamentals and share learning resources.", category: "Cybersecurity", rules: "Share only ethical, legal exercises.", visibility: "private", ownerId: "nisha-demo", moderatorIds: [], memberIds: ["nisha-demo"], requestIds: [], discussions: [], createdAt: 1760320000000 }
  ],
  teams: [
    { id: "campus-ai", name: "Campus AI", description: "A student friendly study companion.", idea: "Turn notes into practice questions and learning plans.", hackathon: "Lumi Build Day", skills: ["React", "Python", "AI"], roles: ["Frontend", "ML"], ownerId: "raj-demo", memberIds: ["raj-demo", "arun-demo"], requestIds: [], capacity: 4, recruiting: true },
    { id: "pocket-campus", name: "Pocket Campus", description: "Useful campus services in one mobile app.", idea: "Events and peer support in one place.", hackathon: "Student Innovation Sprint", skills: ["Flutter", "Firebase"], roles: ["Designer", "Backend"], ownerId: "priya-demo", memberIds: ["priya-demo"], requestIds: [], capacity: 4, recruiting: true }
  ],
  projects: [
    { id: "study-spark", title: "Study Spark", description: "A prototype that turns study notes into focused practice prompts.", websiteUrl: "", githubUrl: "", ownerId: "raj-demo", topic: "Artificial Intelligence" },
    { id: "campus-compass", title: "Campus Compass", description: "A mobile interface for finding student events and groups.", websiteUrl: "", githubUrl: "", ownerId: "priya-demo", topic: "Mobile Development" }
  ]
};

export function loadDemo(): DemoState {
  try {
    const value = window.localStorage.getItem(DEMO_KEY);
    if (!value) return structuredClone(demoSeed);
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null && "version" in parsed && parsed.version === 1 && "users" in parsed && "servers" in parsed && "teams" in parsed && "projects" in parsed && Array.isArray(parsed.users) && Array.isArray(parsed.servers) && Array.isArray(parsed.teams) && Array.isArray(parsed.projects)) return parsed as DemoState;
  } catch { /* Browser storage can be unavailable. The demo still opens. */ }
  return structuredClone(demoSeed);
}

export function saveDemo(value: DemoState) {
  try { window.localStorage.setItem(DEMO_KEY, JSON.stringify(value)); } catch { /* Surface remains usable until refresh. */ }
}
