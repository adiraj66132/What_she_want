import { SCORE_KEYS, scoreLabels, type AnalysisResult } from "@convo/schemas";
import { useState, type ReactNode } from "react";
import { useCountUp } from "../useCountUp";

const DIM_COLOR: Record<string, string> = {
  warmth: "bg-amber-500",
  emotionalIntensity: "bg-orange-500",
  affectionSignals: "bg-rose-400",
  playfulness: "bg-orange-400",
  tension: "bg-red-500/80",
  clarity: "bg-zinc-300",
  ambiguity: "bg-yellow-500/70",
  conversationOpenness: "bg-sky-400",
};

function highlight(message: string, phrases: string[]): ReactNode {
  const found = phrases.filter((p) => p && message.includes(p));
  if (found.length === 0) return message;
  const escaped = found.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  return message.split(re).map((part, i) =>
    found.includes(part) ? (
      <mark
        key={i}
        className="bg-orange-500/15 px-0.5 text-orange-200 decoration-dotted decoration-orange-400/80 underline-offset-4"
        style={{ textDecorationLine: "underline" }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function ProfileRow({
  label,
  value,
  color,
  index,
}: {
  label: string;
  value: number;
  color: string;
  index: number;
}) {
  const shown = useCountUp(value, index * 70 + 150);
  return (
    <div className="flex items-center gap-4">
      <span className="w-44 shrink-0 text-sm text-zinc-400">{label}</span>
      <div className="h-2.5 flex-1 bg-zinc-800/80">
        <div
          className={`bar-grow h-2.5 ${color}`}
          style={{ width: `${value}%`, animationDelay: `${index * 70}ms` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-display text-sm font-semibold tabular-nums text-zinc-200">
        {shown}
      </span>
    </div>
  );
}

const confidenceLabel: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-400/90">
      {children}
    </h3>
  );
}

export default function AnalysisCard({
  result,
  meta,
  message,
}: {
  result: AnalysisResult;
  meta?: { provider: string; model: string; durationMs: number };
  message?: string;
}) {
  const [open, setOpen] = useState(false);
  const showQuote = Boolean(message && !message.startsWith("(message not stored)"));
  const mainReading = result.possibleReadings[0];
  const mainConf = useCountUp(mainReading?.confidence ?? 0, 450);

  return (
    <div className="rise border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20">
      <div className="px-6 pb-5 pt-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
            Analysis
          </span>
          <span className="font-display text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {confidenceLabel[result.overallConfidence]} confidence
          </span>
        </div>

        {showQuote && (
          <p className="mt-4 font-display text-xl leading-snug text-zinc-100">
            &ldquo;{highlight(message!, result.signals.map((s) => s.phrase))}&rdquo;
          </p>
        )}

        <div className="mt-5 border-t border-zinc-800/70 pt-5">
          <SectionLabel>The read</SectionLabel>
          <p className="text-lg leading-relaxed text-zinc-200">{result.summary}</p>
          {mainReading && (
            <div className="mt-4 border border-zinc-700/70 bg-zinc-950/50 px-4 py-3">
              <div className="font-display text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Main reading
              </div>
              <div className="mt-1.5 font-display text-base font-semibold text-zinc-100">
                {mainReading.interpretation}
              </div>
              <div className="mt-1 font-display text-xs font-medium text-orange-400/80">
                {mainConf}% confidence
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-zinc-800/70 pt-5">
          <SectionLabel>Emotional profile</SectionLabel>
          <div className="space-y-3">
            {SCORE_KEYS.map((key, i) => (
              <ProfileRow
                key={key}
                label={scoreLabels[key]}
                value={result.scores[key]}
                color={DIM_COLOR[key]}
                index={i}
              />
            ))}
          </div>
        </div>

        {result.signals.length > 0 && (
          <div className="mt-5 border-t border-zinc-800/70 pt-5">
            <SectionLabel>Signals</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {result.signals.map((s, i) => (
                <span
                  key={i}
                  className="border border-zinc-700/60 bg-zinc-950/50 px-3 py-1.5 text-sm"
                >
                  <code className="font-display font-medium text-orange-300">"{s.phrase}"</code>
                  <span className="mx-1.5 text-zinc-600">·</span>
                  <span className="text-zinc-300">{s.interpretation}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              {result.signals.length} signal{result.signals.length === 1 ? "" : "s"} detected
            </p>
          </div>
        )}

        <div className="mt-5 border-t border-zinc-800/70 pt-4">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between font-display text-sm font-semibold text-orange-400 transition hover:text-orange-300"
          >
            Why this read?
            <span className="text-xs text-zinc-500">
              {open ? "− Hide detailed reasoning" : "+ Show detailed reasoning"}
            </span>
          </button>

          {open && (
            <div className="expand-in mt-4 space-y-5">
              <div>
                <div className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  All interpretations
                </div>
                <ul className="space-y-3">
                  {result.possibleReadings.map((r, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-orange-500/15 font-display text-[11px] font-bold text-orange-400">
                        {i + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-display text-sm font-semibold text-zinc-100">
                            {r.interpretation}
                          </span>
                          <span className="font-display text-[11px] tabular-nums text-zinc-500">
                            {r.confidence}% confidence
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm leading-relaxed text-zinc-400">
                          {r.reasoning}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {result.concerns.length > 0 && (
                <div>
                  <div className="mb-1 font-display text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Possible pitfalls
                  </div>
                  <ul className="list-inside list-disc text-sm text-amber-500/90">
                    {result.concerns.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {meta && (
                <p className="font-display text-[11px] text-zinc-600">
                  {meta.provider} / {meta.model} · {meta.durationMs}ms
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
