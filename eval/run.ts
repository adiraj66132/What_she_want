import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Scores, ScoreKey } from "@convo/schemas";
import { analyzeMessage } from "../apps/api/src/analysis/service";
import { getProvider } from "../apps/api/src/providers";

type Entry = {
  message: string;
  min?: Partial<Record<ScoreKey, number>>;
  max?: Partial<Record<ScoreKey, number>>;
};

const here = dirname(fileURLToPath(import.meta.url));
const entries = JSON.parse(readFileSync(join(here, "messages.json"), "utf8")) as Entry[];

const provider = getProvider(process.env.EVAL_PROVIDER ?? "openrouter");
const model = process.env.EVAL_MODEL ?? "openai/gpt-4o-mini";

interface Outcome {
  message: string;
  ms: number;
  scores?: Scores;
  error?: string;
  violations: string[];
}

async function analyzeOne(entry: Entry): Promise<Outcome> {
  const started = Date.now();
  try {
    const { result } = await analyzeMessage(provider, { model, message: entry.message });
    const violations: string[] = [];
    for (const [key, value] of Object.entries(entry.min ?? {})) {
      if (result.scores[key as ScoreKey] < (value as number))
        violations.push(`${key} ${result.scores[key as ScoreKey]} < min ${value}`);
    }
    for (const [key, value] of Object.entries(entry.max ?? {})) {
      if (result.scores[key as ScoreKey] > (value as number))
        violations.push(`${key} ${result.scores[key as ScoreKey]} > max ${value}`);
    }
    return { message: entry.message, ms: Date.now() - started, scores: result.scores, violations };
  } catch (err) {
    return {
      message: entry.message,
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
      violations: ["request failed"],
    };
  }
}

const outcomes: Outcome[] = [];
const CONCURRENCY = 4;
for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const chunk = entries.slice(i, i + CONCURRENCY);
  outcomes.push(...(await Promise.all(chunk.map(analyzeOne))));
}

const short = (s: string) => (s.length > 28 ? s.slice(0, 27) + "…" : s);
const keys: ScoreKey[] = [
  "warmth", "emotionalIntensity", "affectionSignals", "playfulness",
  "tension", "clarity", "ambiguity", "conversationOpenness",
];

console.log(["message", ...keys.map((k) => k.slice(0, 6)), "ms", "flags"].join("\t"));
for (const o of outcomes) {
  console.log(
    [
      short(o.message),
      ...(o.scores ? keys.map((k) => String(o.scores![k])) : keys.map(() => "-")),
      String(o.ms),
      o.error ? "ERROR" : o.violations.length ? o.violations.join("; ") : "ok",
    ].join("\t")
  );
}

writeFileSync(join(here, "out.json"), JSON.stringify({ model, outcomes }, null, 2));

const errors = outcomes.filter((o) => o.error);
const violations = outcomes.flatMap((o) => o.violations.filter((v) => v !== "request failed"));
console.log(
  `\n${outcomes.length} messages · ${errors.length} errors · ${violations.length} expectation violations`
);
process.exit(errors.length || violations.length ? 1 : 0);
