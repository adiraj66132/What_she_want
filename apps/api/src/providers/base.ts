import OpenAI from "openai";
import type { ModelInfo } from "@convo/schemas";
import type { AIProvider, ChatParams, ChatResult } from "./types";

interface Options {
  baseUrl: string;
  apiKey?: string;
  fallbackModels: ModelInfo[];
  modelsUrl?: string;
  preferredModels?: string[];
}

function strictify(schema: object): Record<string, unknown> {
  const s = JSON.parse(JSON.stringify(schema)) as any;
  delete s.$schema;
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.$defs) Object.values(node.$defs).forEach(walk);
    if (node.type === "object") {
      node.additionalProperties = false;
      node.required = Object.keys(node.properties ?? {});
      Object.values(node.properties ?? {}).forEach(walk);
    }
    if (node.type === "array") walk(node.items);
  };
  walk(s);
  return s;
}

export class OpenAICompatProvider implements AIProvider {
  private client: OpenAI;

  constructor(
    public id: AIProvider["id"],
    public label: string,
    public local: boolean,
    private opts: Options
  ) {
    this.client = new OpenAI({
      baseURL: opts.baseUrl,
      apiKey: opts.apiKey ?? "not-set",
      timeout: 60_000,
      maxRetries: 1,
    });
  }

  configured(): boolean {
    return this.local || Boolean(this.opts.apiKey);
  }

  async listModels(): Promise<ModelInfo[]> {
    if (this.opts.modelsUrl && this.configured()) {
      try {
        const res = await fetch(this.opts.modelsUrl);
        if (res.ok) {
          const data = (await res.json()) as { data?: any[] };
          const models = (data.data ?? [])
            .filter((m) => typeof m.id === "string" && !m.id.endsWith(":batch"))
            .filter((m) => (m?.architecture?.output_modalities ?? ["text"]).includes("text"))
            .map((m) => ({ id: m.id as string, label: m.id as string, free: isFree(m), fmt: supportsJsonSchema(m) }));
          if (models.length) {
            const sorted = models.sort(
              (a, b) => Number(b.fmt) - Number(a.fmt) || Number(b.free) - Number(a.free)
            );
            const preferred = this.opts.preferredModels?.find((id) =>
              sorted.some((m) => m.id === id)
            );
            const ordered = preferred
              ? [sorted.find((m) => m.id === preferred)!, ...sorted.filter((m) => m.id !== preferred)]
              : sorted;
            return ordered.map(({ id, label }) => ({ id, label }));
          }
        }
      } catch {
      }
    }
    return this.opts.fallbackModels;
  }

  async chat(params: ChatParams): Promise<ChatResult> {
    try {
      const result = await this.chatWithModel(params, params.model);
      return { ...result, model: params.model };
    } catch (primaryError) {
      const freeModel = "openrouter/free";
      if (this.id !== "openrouter" || params.model === freeModel) throw primaryError;

      try {
        const result = await this.chatWithModel(params, freeModel);
        return { ...result, model: freeModel };
      } catch (fallbackError) {
        const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new Error(
          `Selected model failed (${primaryMessage}); free-model fallback failed (${fallbackMessage})`
        );
      }
    }
  }

  private async chatWithModel(params: ChatParams, model: string): Promise<Omit<ChatResult, "model">> {
    const messages = [
      { role: "system" as const, content: params.system },
      { role: "user" as const, content: params.user },
    ];

    if (params.jsonSchema) {
      try {
        const text = await this.complete(model, messages, params.jsonSchema);
        return { text, usedStructuredOutput: true };
      } catch (err) {
        if (!isStructuredOutputUnsupported(err)) throw err;
      }
    }

    const text = await this.complete(model, messages);
    return { text, usedStructuredOutput: false };
  }

  private async complete(model: string, messages: any[], jsonSchema?: object): Promise<string> {
    const res: any = await this.client.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      ...(jsonSchema
        ? {
            response_format: {
              type: "json_schema" as const,
              json_schema: { name: "result", strict: true, schema: strictify(jsonSchema) },
            },
          }
        : {}),
    });
    if (res?.error) throw new Error(res.error.message ?? "Provider returned an error");
    if (!Array.isArray(res?.choices)) throw new Error("Empty response from provider");
    return res.choices[0]?.message?.content ?? "";
  }
}

function isFree(m: any): boolean {
  return Number(m?.pricing?.prompt ?? 1) === 0 && Number(m?.pricing?.completion ?? 1) === 0;
}

function supportsJsonSchema(m: any): boolean {
  return Array.isArray(m?.supported_parameters) && m.supported_parameters.includes("response_format");
}

function isStructuredOutputUnsupported(err: unknown): boolean {
  const status = (err as any)?.status ?? (err as any)?.statusCode;
  const msg = String((err as any)?.message ?? "");
  return (
    /response_format|json_schema|structured/i.test(msg) &&
    (status === 400 || /not support|unsupported|invalid/i.test(msg))
  );
}
