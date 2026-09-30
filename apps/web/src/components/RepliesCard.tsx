import type { ReplyResult } from "@convo/schemas";
import { useState } from "react";

const toneStyle: Record<string, { border: string; chip: string }> = {
  casual: { border: "border-orange-900/70", chip: "bg-orange-500/10 text-orange-400" },
  playful: { border: "border-amber-700/70", chip: "bg-amber-500/10 text-amber-400" },
  calm: { border: "border-zinc-700", chip: "bg-zinc-800 text-zinc-400" },
};

export default function RepliesCard({ result }: { result: ReplyResult }) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="rise relative overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500" />

      <div className="px-5 py-4">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
          Reply suggestions — pick what sounds like you
        </span>
        <ul className="mt-3 space-y-2.5">
          {result.replies.map((r, i) => {
            const style = toneStyle[r.tone] ?? toneStyle.calm;
            return (
              <li
                key={i}
                style={{ animationDelay: `${i * 90 + 150}ms` }}
                className={`rise flex items-start justify-between gap-3 border-l-2 bg-zinc-950/60 px-5 py-4 ${style.border}`}
              >
                <div className="min-w-0">
                  <span
                    className={`px-2 py-0.5 font-display text-xs font-semibold uppercase tracking-wider ${style.chip}`}
                  >
                    {r.tone}
                  </span>
                  <p className="mt-2 text-base text-zinc-200">{r.text}</p>
                </div>
                <button
                  onClick={() => copy(r.text, i)}
                  className="shrink-0 border border-zinc-700 px-2.5 py-1 font-display text-[11px] text-zinc-400 transition hover:border-orange-600 hover:text-orange-400"
                >
                  {copied === i ? "Copied ✓" : "Copy"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
