import type { HistoryRow } from "@convo/schemas";

export default function HistoryView({
  rows,
  onOpen,
  onDelete,
  onClose,
}: {
  rows: HistoryRow[];
  onOpen: (row: HistoryRow) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fade-in fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="pop-in flex max-h-[80vh] w-full max-w-lg flex-col border border-zinc-800 bg-zinc-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">History</h2>
          <button
            onClick={onClose}
            className="px-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">No analyses yet.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/60 px-3 py-2.5"
                >
                  <button onClick={() => onOpen(row)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm text-zinc-200">
                      {row.message ?? (
                        <span className="italic text-zinc-600">(message not stored)</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      {new Date(row.createdAt).toLocaleString()} · {row.provider}/{row.model}
                    </p>
                  </button>
                  <button
                    onClick={() => onDelete(row.id)}
                    className="shrink-0 border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition hover:border-red-900 hover:text-red-400"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
