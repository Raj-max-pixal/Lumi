"use client";

import { useState } from "react";
import { Loader2, Sparkles, WandSparkles } from "lucide-react";

export default function MagicWritePanel({ isFocusMode = false }: { isFocusMode?: boolean }) {
  const [input, setInput] = useState("night drive edit is finally live. tell your people to watch till the drop.");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleMagicWrite() {
    setIsLoading(true);
    const response = await fetch("/api/ai/magic-write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: input })
    });
    const result = (await response.json()) as { text?: string };
    setOutput(result.text ?? "");
    setIsLoading(false);
  }

  return (
    <section
      className={`rounded-[32px] border p-5 ${
        isFocusMode ? "border-slate-200 bg-white shadow-xl shadow-slate-200/60" : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className={`font-display text-xl font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Magic Write</h2>
          <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/55"}>
            Transform casual thoughts into polished professional copy.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMagicWrite}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Rewrite
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div
          className={`rounded-3xl border p-4 ${
            isFocusMode ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/25"
          }`}
        >
          <p className={isFocusMode ? "mb-3 text-xs uppercase tracking-[0.24em] text-slate-400" : "mb-3 text-xs uppercase tracking-[0.24em] text-white/35"}>
            Raw Caption
          </p>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className={`min-h-40 w-full bg-transparent text-sm outline-none ${
              isFocusMode ? "text-slate-900" : "text-white"
            }`}
          />
        </div>
        <div
          className={`min-h-40 rounded-3xl border p-4 text-sm leading-7 ${
            isFocusMode ? "border-slate-200 bg-slate-50 text-slate-700" : "border-white/10 bg-black/25 text-white/80"
          }`}
        >
          <div className="mb-3 inline-flex items-center gap-2 text-lumi-purple">
            <WandSparkles className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.24em]">AI Remix</span>
          </div>
          {output || "Your upgraded caption, hook, or post copy will appear here."}
        </div>
      </div>
    </section>
  );
}
