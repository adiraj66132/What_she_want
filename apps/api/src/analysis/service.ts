import {
  analysisResultSchema,
  replyResultSchema,
  type AnalysisResult,
  type ReplyResult,
} from "@convo/schemas";
import { z } from "zod";
import type { AIProvider } from "../providers/types";
import {
  ANALYZE_SYSTEM_PROMPT,
  REPLY_SYSTEM_PROMPT,
  analyzeUserPrompt,
  replyUserPrompt,
} from "./prompts";

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return trimmed;
}

async function runStructured<T>(
  provider: AIProvider,
  opts: { model: string; system: string; user: string; schema: z.ZodType<T> }
): Promise<{ value: T; usedStructuredOutput: boolean; model: string }> {
  let lastError = "";
  let usedStructuredOutput = false;
  let usedModel = opts.model;

  for (let attempt = 0; attempt < 2; attempt++) {
    const user = attempt === 0 ? opts.user : `${opts.user}\n\nYour previous response failed validation with these errors:\n${lastError}\nReturn the corrected JSON only.`;
    const { text, usedStructuredOutput: used, model } = await provider.chat({
      model: opts.model,
      system: opts.system,
      user,
      jsonSchema: z.toJSONSchema(opts.schema, { io: "output" }) as object,
    });
    usedStructuredOutput = used;
    usedModel = model;

    try {
      const parsed: unknown = JSON.parse(extractJson(text));
      const result = opts.schema.safeParse(parsed);
      if (result.success) return { value: result.data, usedStructuredOutput, model: usedModel };
      lastError = result.error.issues
        .slice(0, 8)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
    } catch (err) {
      lastError = `invalid JSON: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  throw Object.assign(new Error(`Model output failed validation: ${lastError}`), {
    statusCode: 502,
  });
}

export async function analyzeMessage(
  provider: AIProvider,
  opts: { model: string; message: string; context?: string }
): Promise<{ result: AnalysisResult; usedStructuredOutput: boolean; model: string }> {
  const { value, usedStructuredOutput, model } = await runStructured(provider, {
    model: opts.model,
    system: ANALYZE_SYSTEM_PROMPT,
    user: analyzeUserPrompt(opts.message, opts.context),
    schema: analysisResultSchema,
  });
  return { result: value, usedStructuredOutput, model };
}

export async function suggestReplies(
  provider: AIProvider,
  opts: { model: string; message: string; context?: string }
): Promise<{ result: ReplyResult; usedStructuredOutput: boolean; model: string }> {
  const { value, usedStructuredOutput, model } = await runStructured(provider, {
    model: opts.model,
    system: REPLY_SYSTEM_PROMPT,
    user: replyUserPrompt(opts.message, opts.context),
    schema: replyResultSchema,
  });
  return { result: value, usedStructuredOutput, model };
}
