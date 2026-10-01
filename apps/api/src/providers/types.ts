import type { ModelInfo, ProviderId, ProviderInfo } from "@convo/schemas";

export interface ChatParams {
  model: string;
  system: string;
  user: string;
  jsonSchema?: object;
}

export interface ChatResult {
  text: string;
  usedStructuredOutput: boolean;
  model: string;
}

export interface AIProvider {
  id: ProviderId;
  label: string;
  local: boolean;
  configured(): boolean;
  listModels(): Promise<ModelInfo[]>;
  chat(params: ChatParams): Promise<ChatResult>;
}
