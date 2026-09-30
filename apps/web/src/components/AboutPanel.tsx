export default function AboutPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fade-in fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="pop-in max-h-[85vh] w-full max-w-lg overflow-y-auto border border-zinc-800 bg-zinc-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">About</h2>
          <button
            onClick={onClose}
            className="px-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center gap-4">
            <img
              src="/heart.png"
              alt=""
              className="h-14 w-14 shrink-0 drop-shadow-[0_0_16px_rgba(249,115,22,0.35)]"
            />
            <div>
              <p className="font-display text-xl font-bold text-zinc-100">
                What is <span className="text-orange-500">She Want?</span>
              </p>
              <p className="text-sm text-zinc-500">Understand the message, not the person.</p>
            </div>
          </div>

          <section className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              How it works
            </h3>
            <ol className="mt-2 space-y-1.5 text-sm text-zinc-300">
              <li>
                <span className="text-orange-500">1.</span> Paste any message you received.
              </li>
              <li>
                <span className="text-orange-500">2.</span> Press Enter to send it for analysis.
              </li>
              <li>
                <span className="text-orange-500">3.</span> Get the read — what the message is
                actually saying.
              </li>
            </ol>
          </section>

          <section className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              What you get
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
              <li>
                <span className="text-zinc-100">Emotional profile</span> — warmth, tension,
                clarity, intensity and more, as one visual read.
              </li>
              <li>
                <span className="text-zinc-100">Signals</span> — the specific phrases and cues the
                read is based on, highlighted in the message.
              </li>
              <li>
                <span className="text-zinc-100">Confidence + “Why this read?”</span> — how sure it
                is, and the reasoning behind it.
              </li>
              <li>
                <span className="text-zinc-100">Reply suggestions</span> — switch the composer to
                Reply mode to get suggested responses.
              </li>
              <li>
                <span className="text-zinc-100">Thread context</span> — recent messages in the
                thread are sent along automatically for a better read.
              </li>
              <li>
                <span className="text-zinc-100">History</span> — every analysis is saved so you
                can revisit it later.
              </li>
            </ul>
          </section>

          <section className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              Providers
            </h3>
            <p className="mt-2 text-sm text-zinc-300">
              Works with{" "}
              <span className="text-zinc-100">OpenRouter</span> (cloud),{" "}
              <span className="text-zinc-100">Ollama</span> (local, nothing leaves your machine)
              and <span className="text-zinc-100">Zen</span> — pick one in ⚙ Settings.
            </p>
          </section>

          <p className="mt-5 border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
            Privacy: message text is stored in history only if you enable it in Settings. With
            Ollama, messages never leave this machine.
          </p>
        </div>
      </div>
    </div>
  );
}
