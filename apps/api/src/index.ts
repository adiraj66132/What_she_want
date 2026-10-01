import cors from "@fastify/cors";
import Fastify from "fastify";
import type { ZodType } from "zod";
import {
  analyzeRequestSchema,
  replyRequestSchema,
  type AnalyzeResponse,
} from "@convo/schemas";
import { analyzeMessage, suggestReplies } from "./analysis/service";
import { deleteAnalysis, listAnalyses, saveAnalysis } from "./db";
import { getProvider, providerInfos } from "./providers";

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });

function parse<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    throw Object.assign(new Error(msg), { statusCode: 400 });
  }
  return r.data;
}

function fail(message: string, statusCode = 502): never {
  throw Object.assign(new Error(message), { statusCode });
}

fastify.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
  fastify.log.error(err);
  reply.status(err.statusCode ?? 500).send({ error: err.message });
});

fastify.get("/api/providers", async () => ({ providers: await providerInfos() }));

fastify.post("/api/analyze", async (req): Promise<AnalyzeResponse> => {
  const body = parse(analyzeRequestSchema, req.body);
  const provider = getProvider(body.provider);
  if (!provider.configured()) fail(`${provider.label} is not configured`, 400);

  const started = Date.now();
  let result, usedStructuredOutput, usedModel;
  try {
    ({ result, usedStructuredOutput, model: usedModel } = await analyzeMessage(provider, {
      model: body.model,
      message: body.message,
      context: body.context,
    }));
  } catch (err) {
    fail(`Provider error: ${err instanceof Error ? err.message : err}`);
  }

  saveAnalysis({
    provider: body.provider,
    model: usedModel,
    message: body.saveMessage ? body.message : null,
    result,
  });

  return {
    result,
    meta: {
      provider: body.provider,
      model: usedModel,
      durationMs: Date.now() - started,
      usedStructuredOutput,
    },
  };
});

fastify.post("/api/reply", async (req) => {
  const body = parse(replyRequestSchema, req.body);
  const provider = getProvider(body.provider);
  if (!provider.configured()) fail(`${provider.label} is not configured`, 400);

  try {
    const { result } = await suggestReplies(provider, {
      model: body.model,
      message: body.message,
      context: body.context,
    });
    return result;
  } catch (err) {
    fail(`Provider error: ${err instanceof Error ? err.message : err}`);
  }
});

fastify.get("/api/history", async () => ({ history: listAnalyses() }));

fastify.delete("/api/history/:id", async (req) => {
  const { id } = req.params as { id: string };
  return { deleted: deleteAnalysis(id) };
});

const port = Number(process.env.PORT ?? 3001);
await fastify.listen({ port, host: "0.0.0.0" });
