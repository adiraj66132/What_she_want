import { z } from "zod";

export const SCORE_KEYS = [
  "warmth",
  "emotionalIntensity",
  "affectionSignals",
  "playfulness",
  "tension",
  "clarity",
  "ambiguity",
  "conversationOpenness",
] as const;

export const scoreKeySchema = z.enum(SCORE_KEYS);
export type ScoreKey = z.infer<typeof scoreKeySchema>;

export const scoreLabels: Record<ScoreKey, string> = {
  warmth: "Warmth",
  emotionalIntensity: "Emotional intensity",
  affectionSignals: "Affection signals",
  playfulness: "Playfulness",
  tension: "Tension",
  clarity: "Clarity",
  ambiguity: "Ambiguity",
  conversationOpenness: "Conversation openness",
};

const score0to100 = z.number().int().min(0).max(100);
const confidenceEnum = z.enum(["low", "medium", "high"]);

export const scoresSchema = z.object(
  Object.fromEntries(SCORE_KEYS.map((k) => [k, score0to100])) as Record<
    ScoreKey,
    z.ZodNumber
  >
);

export const signalSchema = z.object({
  phrase: z.string().min(1),
  interpretation: z.string().min(1),
  confidence: confidenceEnum,
});

export const possibleReadingSchema = z.object({
  interpretation: z.string().min(1),
  reasoning: z.string().min(1),
  confidence: score0to100,
});

export const analysisResultSchema = z.object({
  scores: scoresSchema,
  signals: z.array(signalSchema).max(20),
  possibleReadings: z.array(possibleReadingSchema).min(1).max(6),
  concerns: z.array(z.string()),
  summary: z.string().min(1),
  overallConfidence: confidenceEnum,
});

export type Scores = z.infer<typeof scoresSchema>;
export type Signal = z.infer<typeof signalSchema>;
export type PossibleReading = z.infer<typeof possibleReadingSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const replySuggestionSchema = z.object({
  tone: z.enum(["casual", "playful", "calm"]),
  text: z.string().min(1),
});

export const replyResultSchema = z.object({
  replies: z.array(replySuggestionSchema).min(1).max(6),
});

export type ReplySuggestion = z.infer<typeof replySuggestionSchema>;
export type ReplyResult = z.infer<typeof replyResultSchema>;

export type ProviderId = "openrouter" | "ollama" | "zen";

export const analyzeRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z.string().max(4000).optional(),
  provider: z.enum(["openrouter", "ollama", "zen"]),
  model: z.string().min(1),
  saveMessage: z.boolean().optional().default(false),
});

export const replyRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z.string().max(4000).optional(),
  provider: z.enum(["openrouter", "ollama", "zen"]),
  model: z.string().min(1),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type ReplyRequest = z.infer<typeof replyRequestSchema>;

export interface ModelInfo {
  id: string;
  label: string;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  configured: boolean;
  local: boolean;
  models: ModelInfo[];
}

export interface AnalyzeResponse {
  result: AnalysisResult;
  meta: {
    provider: ProviderId;
    model: string;
    durationMs: number;
    usedStructuredOutput: boolean;
  };
}

export interface HistoryRow {
  id: string;
  createdAt: string;
  provider: ProviderId;
  model: string;
  message: string | null;
  result: AnalysisResult;
}
