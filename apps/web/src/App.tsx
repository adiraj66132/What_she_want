import type {
  AnalysisResult,
  HistoryRow,
  ProviderId,
  ProviderInfo,
  ReplyResult,
} from "@convo/schemas";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import AnalysisCard from "./components/AnalysisCard";
import AboutPanel from "./components/AboutPanel";
import HistoryView from "./components/HistoryView";
import RepliesCard from "./components/RepliesCard";
import SettingsPanel from "./components/SettingsPanel";

type Mode = "analyze" | "reply";

type ThreadItem =
  | { id: string; kind: "user"; text: string }
  | {
      id: string;
      kind: "analysis";
      result: AnalysisResult;
      meta?: { provider: string; model: string; durationMs: number };
      source: string;
    }
  | { id: string; kind: "replies"; replies: ReplyResult }
  | { id: string; kind: "error"; text: string }
  | { id: string; kind: "loading" };

const EXAMPLES = [
  "okayyy whatever, it's fine 😭",
  "when are you free this week?",
  "leave me alone",
];

export default function App() {
  const [items, setItems] = useState<ThreadItem[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("analyze");
  const [sending, setSending] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState<ProviderId | "">("");
  const [model, setModel] = useState("");
  const [saveMessage, setSaveMessage] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [useContext, setUseContext] = useState(true);

  const scrollRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const genRef = useRef(0);

  useEffect(() => {
    api
      .providers()
      .then((list) => {
        setProviders(list);
        const first = list.find((p) => p.configured) ?? list[0];
        if (first) {
          setProvider(first.id);
          setModel(first.models[0]?.id ?? "");
        }
      })
      .catch((e) =>
        setItems((prev) => [
          ...prev,
          { id: crypto.randomUUID(), kind: "error", text: `Failed to load providers: ${e.message}` },
        ])
      );
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [items]);

  const currentProvider = providers.find((p) => p.id === provider);
  const currentModelLabel =
    currentProvider?.models.find((m) => m.id === model)?.label ?? model;

  const selectProvider = (id: ProviderId) => {
    setProvider(id);
    const p = providers.find((x) => x.id === id);
    setModel(p?.models[0]?.id ?? "");
  };

  const grow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const priorContextMessages = (list: ThreadItem[]): string[] =>
    list
      .filter((it): it is Extract<ThreadItem, { kind: "user" }> => it.kind === "user")
      .map((it) => it.text)
      .filter((t) => !t.startsWith("(message not stored)"))
      .slice(-5);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending || !provider || !model) return;

    const context = useContext
      ? priorContextMessages(items).join("\n").slice(-4000) || undefined
      : undefined;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    const gen = genRef.current;
    const loadingId = crypto.randomUUID();
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: "user", text: message },
      { id: loadingId, kind: "loading" },
    ]);

    try {
      if (mode === "analyze") {
        const res = await api.analyze({
          message,
          context,
          provider: provider as ProviderId,
          model,
          saveMessage,
        });
        setItems((prev) =>
          prev.map((it) =>
            it.id === loadingId
              ? { id: loadingId, kind: "analysis", result: res.result, meta: res.meta, source: message }
              : it
          )
        );
      } else {
        const replies = await api.reply({
          message,
          context,
          provider: provider as ProviderId,
          model,
        });
        setItems((prev) =>
          prev.map((it) => (it.id === loadingId ? { id: loadingId, kind: "replies", replies } : it))
        );
      }
    } catch (e) {
      const text2 = e instanceof Error ? e.message : String(e);
      setItems((prev) =>
        prev.map((it) => (it.id === loadingId ? { id: loadingId, kind: "error", text: text2 } : it))
      );
    } finally {
      if (gen === genRef.current) setSending(false);
    }
  };

  const openHistoryRow = (row: HistoryRow) => {
    setHistoryOpen(false);
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        kind: "user",
        text: row.message ?? "(message not stored)",
      },
      {
        id: crypto.randomUUID(),
        kind: "analysis",
        result: row.result,
        meta: { provider: row.provider, model: row.model, durationMs: 0 },
        source: row.message ?? "(message not stored)",
      },
    ]);
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="font-display text-xl font-bold tracking-tight">
            What is <span className="text-orange-500">She Want?</span>
            <span className="ml-3 text-xs font-normal text-zinc-600">
              Understand the message, not the person.
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                genRef.current++;
                setItems([]);
                setInput("");
                setMode("analyze");
                setSending(false);
              }}
              className="border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              ＋ New chat
            </button>
            <button
              onClick={() => setAboutOpen(true)}
              className="border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              ♥ About
            </button>
            <button
              onClick={() => {
                setSettingsOpen(false);
                api.history().then(setHistory).catch(() => {});
                setHistoryOpen(true);
              }}
              className="border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              History
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-orange-800 hover:text-orange-200"
              title="AI provider & model settings"
            >
              <span
                className={`h-1.5 w-1.5 ${currentProvider?.local ? "bg-orange-500" : "bg-sky-500"}`}
              />
              {currentProvider?.label ?? "…"} · {currentModelLabel || "…"}
              <span className="text-zinc-600">⚙</span>
            </button>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {items.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <img
                src="/heart.png"
                alt=""
                className="heart-float mb-5 h-28 w-28 select-none drop-shadow-[0_0_24px_rgba(249,115,22,0.35)]"
              />
              <h2 className="font-display text-3xl font-bold text-zinc-200">
              What is <span className="text-orange-500">She Want?</span>
              </h2>
              <p className="mt-2 text-base text-zinc-500">
                Paste a message below and press Enter to analyze it.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => send(ex)}
                    className="border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-orange-700 hover:text-orange-300"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                if (item.kind === "user")
                  return (
                    <div key={item.id} className="flex justify-end">
                      <div className="rise max-w-[80%] whitespace-pre-wrap border-2 border-orange-900/60 bg-orange-950/40 px-5 py-3 text-base text-zinc-100">
                        {item.text}
                      </div>
                    </div>
                  );
                if (item.kind === "analysis")
                  return (
                    <div key={item.id} className="flex justify-start">
                      <div className="w-full">
                        <AnalysisCard result={item.result} meta={item.meta} message={item.source} />
                      </div>
                    </div>
                  );
                if (item.kind === "replies")
                  return (
                    <div key={item.id} className="flex justify-start">
                      <div className="w-full">
                        <RepliesCard result={item.replies} />
                      </div>
                    </div>
                  );
                if (item.kind === "error")
                  return (
                    <div key={item.id} className="flex justify-start">
                      <div className="rise max-w-[92%] border-2 border-red-900/70 bg-red-950/40 px-5 py-3 text-base text-red-300">
                        {item.text}
                      </div>
                    </div>
                  );
                return (
                  <div key={item.id} className="flex justify-start">
                    <div className="rise flex items-center gap-3 border border-zinc-800 bg-zinc-900 px-5 py-4 text-base text-zinc-500">
                      <span className="flex items-end gap-1">
                        <span className="dot" style={{ animationDelay: "0ms" }} />
                        <span className="dot" style={{ animationDelay: "150ms" }} />
                        <span className="dot" style={{ animationDelay: "300ms" }} />
                      </span>
                      <span>
                        {mode === "analyze" ? "Analyzing message…" : "Writing replies…"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex border border-zinc-800 bg-zinc-900 p-0.5">
              {(
                [
                  ["analyze", "Analyze"],
                  ["reply", "Help me reply"],
                ] as [Mode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 text-xs transition ${
                    mode === m
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const count = priorContextMessages(items).length;
                if (useContext && count === 0) return null;
                return (
                  <button
                    onClick={() => setUseContext((v) => !v)}
                    title={
                      useContext
                        ? "Previous messages in this thread are sent as analysis context. Click to turn off."
                        : "Context is off. Click to send previous thread messages as context."
                    }
                    className={`border px-2.5 py-1 text-[11px] transition ${
                      useContext
                        ? "border-orange-900/70 bg-orange-950/40 text-orange-500 hover:border-orange-800"
                        : "border-zinc-800 text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {useContext
                      ? `+ ${count} previous message${count === 1 ? "" : "s"} as context`
                      : "Context off"}
                  </button>
                );
              })()}
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-[11px] text-zinc-600 transition hover:text-zinc-400"
              >
                {currentProvider?.local
                  ? "local · Ollama"
                  : currentProvider
                    ? `sent to ${currentProvider.label}`
                    : ""}
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                grow();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder={
                mode === "analyze"
                  ? "Paste a message and press Enter…"
                  : "Paste the message you want to reply to…"
              }
              className="max-h-48 min-h-[52px] flex-1 resize-none border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-base text-zinc-100 placeholder-zinc-600 transition-colors focus:border-orange-600 focus:outline-none"
            />
            <button
              onClick={() => void send()}
              disabled={sending || !input.trim() || !provider || !model}
              className="h-[52px] shrink-0 bg-orange-600 px-7 font-display text-base font-semibold text-white transition hover:bg-orange-500 active:scale-95 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </footer>

      {settingsOpen && (
        <SettingsPanel
          providers={providers}
          provider={provider}
          model={model}
          saveMessage={saveMessage}
          onSelectProvider={selectProvider}
          onSelectModel={setModel}
          onToggleSaveMessage={setSaveMessage}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {aboutOpen && <AboutPanel onClose={() => setAboutOpen(false)} />}

      {historyOpen && (
        <HistoryView
          rows={history}
          onOpen={openHistoryRow}
          onDelete={async (id) => {
            await api.deleteHistory(id);
            setHistory((h) => h.filter((r) => r.id !== id));
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}
