import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { desc, eq } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { AnalysisResult, HistoryRow, ProviderId } from "@convo/schemas";

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  message: text("message"),
  result: text("result", { mode: "json" }).$type<AnalysisResult>().notNull(),
});

const sqlite = new Database(process.env.DATABASE_PATH ?? new URL("../../../../convo.db", import.meta.url).pathname);
sqlite.pragma("journal_mode = WAL");
sqlite.exec(`CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  message TEXT,
  result TEXT NOT NULL
)`);

export const db = drizzle(sqlite);

export function saveAnalysis(row: {
  provider: ProviderId;
  model: string;
  message: string | null;
  result: AnalysisResult;
}): string {
  const id = crypto.randomUUID();
  db.insert(analyses)
    .values({ id, createdAt: new Date(), provider: row.provider, model: row.model, message: row.message, result: row.result })
    .run();
  return id;
}

export function listAnalyses(): HistoryRow[] {
  const rows = db.select().from(analyses).orderBy(desc(analyses.createdAt)).limit(100).all();
  return rows.map((r) => ({
    id: r.id,
    createdAt: new Date(r.createdAt).toISOString(),
    provider: r.provider as ProviderId,
    model: r.model,
    message: r.message,
    result: r.result,
  }));
}

export function deleteAnalysis(id: string): boolean {
  return db.delete(analyses).where(eq(analyses.id, id)).run().changes > 0;
}
