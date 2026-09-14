export async function summarizeConversation(messages: string[]): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (!messages.length) {
    return "No messages yet. Once the chat is active, Lumi can generate a Gemini-powered summary here.";
  }

  return `Summary: ${messages.slice(-4).join(" ").slice(0, 180)}...`;
}

export async function magicWrite(text: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!text.trim()) {
    return "";
  }

  return `Professional rewrite: ${text
    .replace(/\bi'm\b/gi, "I am")
    .replace(/\bgonna\b/gi, "going to")
    .replace(/\bwanna\b/gi, "would like to")
    .replace(/\bhey\b/gi, "Hello")
    .trim()}`;
}

export type AIPersonalityMode = "coach" | "savage" | "mentor";

export async function aiToolbox({
  tool,
  prompt,
  personality = "mentor"
}: {
  tool:
    | "caption"
    | "hashtags"
    | "viral-ideas"
    | "thread"
    | "bio"
    | "image"
    | "video"
    | "voice"
    | "avatar"
    | "assistant"
    | "growth"
    | "job"
    | "feed-control"
    | "moderation"
    | "translator"
    | "auto-reply";
  prompt: string;
  personality?: AIPersonalityMode;
}): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 650));

  const tone =
    personality === "coach"
      ? "Motivational coach tone"
      : personality === "savage"
        ? "Savage best-friend tone"
        : "Professional mentor tone";

  const cleaned = prompt.trim() || "your latest post";

  const outputs: Record<string, string> = {
    caption: `${tone}: "${cleaned}" can become "Late-night build. Early-morning payoff. Lumi mode on."`,
    hashtags: `${tone}: #Lumi #CreatorLife #ViralContent #FYP #NightShift`,
    "viral-ideas": `${tone}: Post a before/after carousel, a 12-second hook reel, and a bold hot-take thread tied to ${cleaned}.`,
    thread: `${tone}: 1. Start with the sharp opinion.\n2. Explain the lesson from ${cleaned}.\n3. End with a challenge for replies.`,
    bio: `${tone}: Creator | storyteller | building cool things online | open to collabs`,
    image: `${tone}: Generate a neon editorial portrait concept with cinematic lighting based on "${cleaned}".`,
    video: `${tone}: Generate a short reel plan: 0-2s hook, 3-7s reveal, 8-12s payoff, caption overlay from ${cleaned}.`,
    voice: `${tone}: Create a confident warm voice-over script for "${cleaned}" with a 15-second delivery.`,
    avatar: `${tone}: Design an AI avatar persona with chrome accents, dark-mode styling, and creator energy.`,
    assistant: `${tone}: Here is a direct answer for "${cleaned}" with practical next steps and a concise action plan.`,
    growth: `${tone}: Best post window is around 7 PM, tighten your hook, add a carousel follow-up, and reply to early comments fast.`,
    job: `${tone}: Resume headline, top skills, portfolio improvements, interview practice questions, and matching roles can be generated from "${cleaned}".`,
    "feed-control": `${tone}: Feed tuned. More tech + creator business. Less cringe pranks + low-value reposts.`,
    moderation: `${tone}: Flagged content review: probable spam, mild toxicity markers, and recommendation to rate-limit the account.`,
    translator: `${tone}: Instant translation ready for global audience messaging with simplified, polished phrasing.`,
    "auto-reply": `${tone}: Auto-reply draft: "I am offline right now, but I saw your message. I will get back to you soon."`
  };

  return outputs[tool];
}
