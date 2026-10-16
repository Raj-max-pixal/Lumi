import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };
const recentRequests = new Map<string, number>();

export async function POST(request: NextRequest) {
  const key = process.env.OLLAMA_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Lumi AI is waiting for its Ollama API key. Ask the site owner to configure OLLAMA_API_KEY in Vercel." }, { status: 503 });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token || token.length > 4096) return NextResponse.json({ error: "Sign in to use Lumi AI." }, { status: 401 });
  const firebaseKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!firebaseKey) return NextResponse.json({ error: "Lumi authentication is not configured." }, { status: 503 });

  let uid = "";
  try {
    const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      signal: AbortSignal.timeout(7000),
      cache: "no-store"
    });
    const authData = await authResponse.json() as { users?: { localId?: string; disabled?: boolean }[] };
    if (authResponse.ok && !authData.users?.[0]?.disabled) uid = authData.users?.[0]?.localId ?? "";
  } catch { /* Return the same safe error as other failed token checks. */ }
  if (!uid) return NextResponse.json({ error: "Your sign-in has expired. Sign in again and retry." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a valid chat message." }, { status: 400 }); }
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 9 || messages.some((item) => !item || (item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string" || !item.content.trim() || item.content.length > 1200) || messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "Send a message under 1,200 characters with up to eight previous turns." }, { status: 400 });
  }

  const now = Date.now();
  if (recentRequests.size > 2000) for (const [id, time] of recentRequests) if (now - time > 60_000) recentRequests.delete(id);
  if (now - (recentRequests.get(uid) ?? 0) < 12_000) return NextResponse.json({ error: "Please wait a few seconds before sending another message." }, { status: 429 });
  recentRequests.set(uid, now);

  try {
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "gemma4:31b",
        messages: [
          { role: "system", content: "You are Lumi AI, a concise, supportive mentor for student developers. Help with coding, debugging, projects, hackathons, and learning plans. Admit uncertainty. Never claim to have run code or changed a user account. Do not request passwords or API keys." },
          ...(messages as ChatMessage[]).map(({ role, content }) => ({ role, content: content.trim() }))
        ],
        stream: false,
        options: { num_predict: 320 }
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store"
    });
    if (!response.ok) {
      return NextResponse.json({ error: response.status === 429 || response.status === 402 ? "Ollama's free allowance is unavailable right now. Please try again after it resets." : "Lumi AI is unavailable right now. Please try again later." }, { status: 503 });
    }
    const result = await response.json() as { message?: { content?: string } };
    const answer = result.message?.content?.trim();
    if (!answer) return NextResponse.json({ error: "Lumi AI returned an empty answer. Please retry." }, { status: 502 });
    return NextResponse.json({ answer: answer.slice(0, 5000) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Lumi AI timed out or could not connect. Please retry." }, { status: 503 });
  }
}
