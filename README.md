# What is She Want?

Conversation intelligence tool: paste a message → AI analyzes it → visual breakdown of linguistic signals → possible interpretations → reply suggestions. It analyzes **language, not minds** — every output says "this message contains signals of…" rather than claiming to know anyone's intentions.

## Stack

- `apps/web` — React, TypeScript, Vite, Tailwind CSS
- `apps/api` — Fastify, provider layer (OpenRouter / Ollama / OpenCode Zen via one OpenAI-compatible interface), Zod-gated structured output
- `packages/schemas` — shared Zod schema (`AnalysisResult`, request/response types)

## Run

```bash
npm install
cp <your>/.env .env        # OPENROUTER_API_KEY=... (optionally OPENCODE_API_KEY, OLLAMA_BASE_URL)

npm run dev:api            # http://localhost:3001
npm run dev:web            # http://localhost:5173 (proxies /api)
```

```bash
npm run typecheck          # all three workspaces
npm run eval               # 40-message eval set against the API pipeline (needs key in .env)
```

## Privacy

- Analysis always goes through the backend. The UI shows which provider the message is sent to.
- Ollama (local) is a provider option: message goes to your machine, not a cloud vendor.
- History stores scores/results by default; raw message text is stored only when the "Store message in history" checkbox is on.

## Design notes

- The model must return JSON matching the schema (`response_format: json_schema`), which is then validated by Zod with one retry on failure. Providers that reject structured output fall back to prompt-only JSON.
- Scores are integers 0–100 across 8 dimensions: warmth, emotional intensity, affection signals, playfulness, tension, clarity, ambiguity, conversation openness — plus signals, possible readings with confidence, and concerns.
