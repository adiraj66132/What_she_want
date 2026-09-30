import type {
  AnalyzeRequest,
  AnalyzeResponse,
  HistoryRow,
  ProviderInfo,
  ReplyRequest,
  ReplyResult,
} from "@convo/schemas";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

const post = (path: string, body: unknown) =>
  request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const api = {
  providers: () =>
    request<{ providers: ProviderInfo[] }>("/api/providers").then((r) => r.providers),
  analyze: (body: AnalyzeRequest) => post("/api/analyze", body) as Promise<AnalyzeResponse>,
  reply: (body: ReplyRequest) => post("/api/reply", body) as Promise<ReplyResult>,
  history: () => request<{ history: HistoryRow[] }>("/api/history").then((r) => r.history),
  deleteHistory: (id: string) =>
    request<{ deleted: boolean }>(`/api/history/${id}`, { method: "DELETE" }),
};
