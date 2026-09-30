import type { ProviderInfo } from "@convo/schemas";
import { OpenAICompatProvider } from "./base";
import type { AIProvider } from "./types";

const openrouter = new OpenAICompatProvider(
  "openrouter",
  "OpenRouter",
  false,
  {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    modelsUrl: "https://openrouter.ai/api/v1/models",
    preferredModels: ["openai/gpt-4o-mini", "openai/gpt-4.1-mini", "google/gemini-2.5-flash"],
    fallbackModels: [{ id: "openai/gpt-4o-mini", label: "gpt-4o-mini" }],
  }
);

const ollama = new OpenAICompatProvider(
  "ollama",
  "Ollama (local)",
  true,
  {
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
    apiKey: "ollama",
    fallbackModels: [
      { id: "qwen3:8b", label: "qwen3:8b" },
      { id: "llama3.1:8b", label: "llama3.1:8b" },
      { id: "gemma3:12b", label: "gemma3:12b" },
    ],
  }
);

const zen = new OpenAICompatProvider(
  "zen",
  "OpenCode Zen",
  false,
  {
    baseUrl: "https://opencode.ai/zen/v1",
    apiKey: process.env.OPENCODE_API_KEY ?? process.env.ZEN_API_KEY,
    fallbackModels: [
      { id: "mimo-v2.6-flash-free", label: "MiMo V2.6 Flash (free)" },
      { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
      { id: "qwen3.8-max", label: "Qwen3.8 Max" },
      { id: "glm-5.3-flash", label: "GLM 5.3 Flash" },
      { id: "kimi-k3", label: "Kimi K3" },
    ],
  }
);

export const providers: Record<ProviderInfo["id"], AIProvider> = {
  openrouter,
  ollama,
  zen,
};

export function getProvider(id: string): AIProvider {
  const p = providers[id as ProviderInfo["id"]];
  if (!p) throw Object.assign(new Error(`Unknown provider: ${id}`), { statusCode: 400 });
  return p;
}

export async function providerInfos(): Promise<ProviderInfo[]> {
  return Promise.all(
    Object.values(providers).map(async (p) => ({
      id: p.id,
      label: p.label,
      configured: p.configured(),
      local: p.local,
      models: await p.listModels(),
    }))
  );
}
