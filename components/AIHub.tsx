"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Bot,
  ImageIcon,
  Languages,
  Loader2,
  MessageSquareText,
  Shield,
  Sparkles,
  Video,
  WandSparkles
} from "lucide-react";
import type { AIPersonalityMode } from "@/lib/ai";

const toolGroups = [
  {
    title: "Create Post",
    icon: MessageSquareText,
    tool: "caption" as const,
    prompt: "night drive reel for creators"
  },
  {
    title: "Generate Image",
    icon: ImageIcon,
    tool: "image" as const,
    prompt: "futuristic creator portrait"
  },
  {
    title: "Create Video",
    icon: Video,
    tool: "video" as const,
    prompt: "12 second launch teaser"
  },
  {
    title: "Profile Insights",
    icon: BadgeCheck,
    tool: "growth" as const,
    prompt: "improve my creator profile"
  },
  {
    title: "Feed Control",
    icon: WandSparkles,
    tool: "feed-control" as const,
    prompt: "show more tech content and hide cringe reels"
  },
  {
    title: "Auto Reply",
    icon: Bot,
    tool: "auto-reply" as const,
    prompt: "reply to a DM while I am offline"
  },
  {
    title: "Translator",
    icon: Languages,
    tool: "translator" as const,
    prompt: "translate my chat for global audience"
  },
  {
    title: "Moderation",
    icon: Shield,
    tool: "moderation" as const,
    prompt: "check toxic comment stream"
  }
];

const personalities: Array<{ id: AIPersonalityMode; label: string }> = [
  { id: "mentor", label: "Professional mentor" },
  { id: "coach", label: "Motivational coach" },
  { id: "savage", label: "Savage friend" }
];

type AITool =
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

export default function AIHub({ isFocusMode = false }: { isFocusMode?: boolean }) {
  const [personality, setPersonality] = useState<AIPersonalityMode>("mentor");
  const [chatPrompt, setChatPrompt] = useState("Give me viral post ideas for a creator app launch this week.");
  const [toolOutput, setToolOutput] = useState("Your free Lumi AI workspace is ready.");
  const [isLoading, setIsLoading] = useState(false);

  async function runTool(tool: AITool, prompt: string) {
    setIsLoading(true);
    const response = await fetch("/api/ai/tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tool, prompt, personality })
    });
    const result = (await response.json()) as { text?: string };
    setToolOutput(result.text ?? "");
    setIsLoading(false);
  }

  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-lumi-purple">
            <Sparkles className="h-5 w-5" />
            <p className="font-display text-2xl font-semibold">Lumi AI Hub</p>
          </div>
          <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>
            Free AI chat, creator tools, moderation, feed control, auto-replies, and personality modes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {personalities.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPersonality(mode.id)}
              className={`rounded-full px-3 py-2 text-xs font-medium ${
                personality === mode.id
                  ? "bg-lumi-purple text-white"
                  : isFocusMode
                    ? "bg-slate-100 text-slate-600"
                    : "bg-white/10 text-white/70"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div
          className={`rounded-[28px] border p-4 ${
            isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
          }`}
        >
          <div className="mb-4 flex items-center gap-2 text-lumi-purple">
            <Bot className="h-4 w-4" />
            <p className="font-display text-lg font-semibold">AI Chat Assistant</p>
          </div>
          <textarea
            value={chatPrompt}
            onChange={(event) => setChatPrompt(event.target.value)}
            className={`min-h-32 w-full rounded-[24px] border p-4 text-sm outline-none ${
              isFocusMode ? "border-slate-200 bg-white text-slate-900" : "border-white/10 bg-black/30 text-white"
            }`}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runTool("assistant", chatPrompt)}
              className="rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white"
            >
              Ask Lumi AI
            </button>
            <button
              type="button"
              onClick={() => runTool("viral-ideas", chatPrompt)}
              className={`rounded-full px-4 py-2 text-sm ${
                isFocusMode ? "bg-white text-slate-700" : "bg-white/10 text-white/80"
              }`}
            >
              Viral ideas
            </button>
            <button
              type="button"
              onClick={() => runTool("thread", chatPrompt)}
              className={`rounded-full px-4 py-2 text-sm ${
                isFocusMode ? "bg-white text-slate-700" : "bg-white/10 text-white/80"
              }`}
            >
              Thread writer
            </button>
          </div>
        </div>

        <div
          className={`rounded-[28px] border p-4 ${
            isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20"
          }`}
        >
          <div className="mb-4 flex items-center gap-2 text-lumi-purple">
            <WandSparkles className="h-4 w-4" />
            <p className="font-display text-lg font-semibold">AI Output</p>
          </div>
          <div
            className={`min-h-48 rounded-[24px] border p-4 text-sm leading-7 ${
              isFocusMode ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-black/30 text-white/80"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-lumi-purple">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </div>
            ) : (
              toolOutput
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toolGroups.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => runTool(item.tool, item.prompt)}
              className={`rounded-[28px] border p-4 text-left transition ${
                isFocusMode
                  ? "border-slate-200 bg-slate-50 hover:bg-white"
                  : "border-white/10 bg-black/20 hover:bg-black/30"
              }`}
            >
              <div className="mb-3 inline-flex rounded-2xl bg-lumi-purple/15 p-3 text-lumi-purple">
                <Icon className="h-5 w-5" />
              </div>
              <p className={`text-sm font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{item.title}</p>
              <p className={isFocusMode ? "mt-2 text-sm text-slate-500" : "mt-2 text-sm text-white/60"}>Run free AI helper</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
