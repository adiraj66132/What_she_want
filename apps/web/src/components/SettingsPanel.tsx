import type { ProviderId, ProviderInfo } from "@convo/schemas";

export default function SettingsPanel({
  providers,
  provider,
  model,
  saveMessage,
  onSelectProvider,
  onSelectModel,
  onToggleSaveMessage,
  onClose,
}: {
  providers: ProviderInfo[];
  provider: ProviderId | "";
  model: string;
  saveMessage: boolean;
  onSelectProvider: (id: ProviderId) => void;
  onSelectModel: (id: string) => void;
  onToggleSaveMessage: (v: boolean) => void;
  onClose: () => void;
}) {
  const current = providers.find((p) => p.id === provider);

  return (
    <div
      className="fade-in fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="pop-in w-full max-w-md border border-zinc-800 bg-zinc-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">AI provider & model</h2>
          <button
            onClick={onClose}
            className="px-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProvider(p.id)}
              disabled={!p.configured}
              className={`flex w-full items-center justify-between border px-3 py-2.5 text-left text-sm disabled:opacity-40 ${
                provider === p.id
                  ? "border-orange-600 bg-orange-600/10 text-zinc-100"
                  : "border-zinc-700 text-zinc-300 transition hover:border-orange-700 hover:bg-zinc-800/50"
              }`}
            >
              <span>{p.label}</span>
              <span className="flex items-center gap-2 text-[11px] text-zinc-500">
                {p.local ? "local" : "cloud"}
                {!p.configured && " · not configured"}
                {provider === p.id && <span className="text-orange-500">●</span>}
              </span>
            </button>
          ))}
        </div>

        <label className="mt-4 flex flex-col gap-1 text-xs text-zinc-500">
          Model
          <select
            value={model}
            onChange={(e) => onSelectModel(e.target.value)}
            className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-orange-600 focus:outline-none"
          >
            {(current?.models ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={saveMessage}
            onChange={(e) => onToggleSaveMessage(e.target.checked)}
            className="accent-orange-600"
          />
          Store message text in history (off = scores only)
        </label>

        <p className="mt-3 bg-zinc-950/60 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
          {current?.local
            ? "Local mode: messages are analyzed by Ollama on this machine."
            : current
              ? `Privacy: messages are sent to ${current.label} for analysis.`
              : "Select a provider."}
        </p>
      </div>
    </div>
  );
}
