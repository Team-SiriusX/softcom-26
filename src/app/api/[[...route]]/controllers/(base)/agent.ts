/**
 * Agent API Controller
 *
 * Hono routes for voice agent interactions.
 * Handles validation, authentication, and error handling.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { TIER_LIMITS } from "@/lib/subscription-utils";

// Request validation schemas
const voiceQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
  businessId: z.string().min(1),
});

const indexDocumentSchema = z.object({
  businessId: z.string().min(1),
  text: z.string().min(10),
  source: z.string().min(1),
  sourceId: z.string().optional(),
  category: z.string().optional(),
});

const ttsSchema = z.object({
  text: z.string().min(1).max(4000),
  // If omitted, ELEVENLABS_VOICE_ID is used.
  voiceId: z.string().min(1).optional(),
  // If omitted, ELEVENLABS_MODEL_ID or ElevenLabs default is used.
  modelId: z.string().min(1).optional(),
  // If omitted, ELEVENLABS_OUTPUT_FORMAT or mp3_44100_128 is used.
  outputFormat: z.string().min(1).optional(),
  // Optional ElevenLabs query params
  optimizeStreamingLatency: z.number().int().min(0).max(4).optional(),
  enableLogging: z.boolean().optional(),
});

const refreshDashboardSchema = z.object({
  businessId: z.string().min(1),
});

// Check if Upstash is configured
function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    process.env.UPSTASH_VECTOR_REST_URL &&
    process.env.UPSTASH_VECTOR_REST_TOKEN
  );
}

function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function isVectorConfigured(): boolean {
  return !!(
    process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
  );
}

const app = new Hono()
  /**
   * POST /api/agent/voice
   * Main voice query endpoint
   */
  .post("/voice", zValidator("json", voiceQuerySchema), async (c) => {
    console.log("[Agent API] Voice endpoint called");
    
    const user = await currentUser();
    if (!user) {
      console.log("[Agent API] Unauthorized - no user");
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    console.log("[Agent API] User authenticated:", user.id);

    // Upstash is optional for /voice (agent can still answer without memory/RAG)
    if (!isUpstashConfigured()) {
      console.warn(
        "[Agent API] Upstash not fully configured; continuing without memory/RAG"
      );
    }

    const { query, sessionId, businessId } = c.req.valid("json");
    console.log("[Agent API] Request:", { query: query.slice(0, 50), businessId, sessionId });

    // Check subscription limits
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    // Get tier limits (default to FREE if no subscription)
    const tier = subscription?.tier || "FREE";
    const tierLimits = TIER_LIMITS[tier];
    const aiQueriesUsed = subscription?.aiQueriesUsed || 0;
    const aiQueriesLimit = subscription?.aiQueriesLimit ?? tierLimits.aiQueriesLimit;

    // Check if user has reached their limit
    if (aiQueriesLimit !== -1 && aiQueriesUsed >= aiQueriesLimit) {
      console.log("[Agent API] AI query limit reached:", { aiQueriesUsed, aiQueriesLimit, tier });
      return c.json(
        {
          success: false,
          error: "AI query limit reached",
          limitReached: true,
          aiQueriesUsed,
          aiQueriesLimit,
          tier,
        },
        403
      );
    }

    // FREE tier users cannot use AI
    if (tier === "FREE") {
      console.log("[Agent API] FREE tier user attempted to use AI");
      return c.json(
        {
          success: false,
          error: "AI assistant is not available on the Free plan. Please upgrade to Pro or Business.",
          upgradeRequired: true,
          tier,
        },
        403
      );
    }

    try {
      // Dynamic import to avoid errors when not configured
      const { processAgentQuery, generateSessionId } = await import("@/lib/agent");
      
      // Trigger background indexing if this is a new session (first query)
      // This ensures vector data is fresh without blocking the response
      if (!sessionId && isVectorConfigured() && process.env.GOOGLE_GEMINI_API_KEY) {
        const { indexBusinessFinancialData } = await import(
          "@/lib/agent/financial-indexer"
        );
        
        // Fire-and-forget indexing
        indexBusinessFinancialData(businessId).catch((err) => {
          console.error("[Agent] Background indexing failed:", err);
        });
      }
      
      const response = await processAgentQuery({
        query,
        sessionId: sessionId || generateSessionId(),
        businessId,
        userId: user.id,
      });

      // Increment AI queries used
      if (subscription) {
        await db.subscription.update({
          where: { userId: user.id },
          data: { aiQueriesUsed: { increment: 1 } },
        });
      }

      console.log("[Agent API] Success:", { answer: response.answer.slice(0, 50), confidence: response.confidence });
      return c.json({
        success: true,
        data: response,
        usage: {
          aiQueriesUsed: aiQueriesUsed + 1,
          aiQueriesLimit,
          tier,
        },
      });
    } catch (error) {
      console.error("[Agent Voice Error]", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to process query",
        },
        500
      );
    }
  })

  /**
   * POST /api/agent/session
   * Create a new agent session
   */
  .post("/session", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Dynamic import to avoid errors when not configured
    const { generateSessionId } = await import("@/lib/agent");
    const sessionId = generateSessionId();

    return c.json({
      success: true,
      data: { sessionId },
    });
  })

  /**
   * POST /api/agent/index
   * Index a document for RAG (admin/internal use)
   */
  .post("/index", zValidator("json", indexDocumentSchema), async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if Upstash is configured
    const geminiConfigured = !!process.env.GOOGLE_GEMINI_API_KEY;
    if (!isVectorConfigured() || !geminiConfigured) {
      return c.json(
        {
          success: false,
          error:
            "Indexing requires Upstash Vector (URL+TOKEN) and GOOGLE_GEMINI_API_KEY.",
        },
        503
      );
    }

    const { businessId, text, source, sourceId, category } = c.req.valid("json");

    try {
      // Dynamic imports
      const agentModule = await import("@/lib/agent");
      const vectorModule = await import("@/lib/upstash/vector");
      
      // Chunk the text
      const chunks = agentModule.chunkText(text);

      // Generate embeddings for all chunks
      const embeddings: number[][] = await Promise.all(
        chunks.map((chunk: string) => agentModule.generateEmbedding(chunk))
      );

      // Upsert each chunk
      await Promise.all(
        chunks.map(async (chunk: string, i: number) => {
          const id = `${businessId}_${source}_${sourceId || Date.now()}_${i}`;
          const metadata = {
            businessId,
            text: chunk,
            source,
            sourceId,
            category,
            createdAt: Date.now(),
          };

          await vectorModule.upsertVector(id, embeddings[i], metadata);
        })
      );

      return c.json({
        success: true,
        data: {
          chunksIndexed: chunks.length,
        },
      });
    } catch (error) {
      console.error("[Agent Index Error]", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to index document",
        },
        500
      );
    }
  })

  /**
   * POST /api/agent/tts
   * Optional text-to-speech endpoint powered by ElevenLabs.
   * Returns audio bytes (mp3 by default).
   */
  .post("/tts", zValidator("json", ttsSchema), async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const defaultVoiceId = process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey || !defaultVoiceId) {
      return c.json(
        {
          success: false,
          error:
            "ElevenLabs is not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.",
        },
        503
      );
    }

    const {
      text,
      voiceId,
      modelId,
      outputFormat,
      optimizeStreamingLatency,
      enableLogging,
    } = c.req.valid("json");

    const finalVoiceId = voiceId || defaultVoiceId;
    const finalModelId = modelId || process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
    const finalOutputFormat =
      outputFormat || process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";

    const url = new URL(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(finalVoiceId)}`
    );
    url.searchParams.set("output_format", finalOutputFormat);
    if (typeof optimizeStreamingLatency === "number") {
      url.searchParams.set("optimize_streaming_latency", String(optimizeStreamingLatency));
    }
    if (typeof enableLogging === "boolean") {
      url.searchParams.set("enable_logging", enableLogging ? "true" : "false");
    }

    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: finalModelId,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return c.json(
          {
            success: false,
            error: `ElevenLabs TTS failed (${res.status}). ${errText || ""}`.trim(),
          },
          502
        );
      }

      const buf = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "audio/mpeg";

      return c.body(buf, 200, {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      });
    } catch (error) {
      console.error("[Agent TTS Error]", error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "TTS request failed",
        },
        502
      );
    }
  })

  /**
   * POST /api/agent/dashboard/refresh
   * Force rebuild & cache the dashboard snapshot/context for the selected business.
   */
  .post(
    "/dashboard/refresh",
    zValidator("json", refreshDashboardSchema),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { businessId } = c.req.valid("json");

      // Prevent cross-tenant refresh requests
      const business = await db.business.findFirst({
        where: { id: businessId, userId: user.id },
        select: { id: true },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      try {
        const { buildDashboardSnapshot, cacheDashboardSnapshot } = await import(
          "@/lib/agent"
        );

        // Build and cache dashboard snapshot
        const snapshot = await buildDashboardSnapshot(businessId);
        await cacheDashboardSnapshot(snapshot);

        // Index financial data into vector database (fire-and-forget for speed)
        // This enables fast semantic search in the voice assistant
        if (isVectorConfigured() && process.env.GOOGLE_GEMINI_API_KEY) {
          const { indexBusinessFinancialData } = await import(
            "@/lib/agent/financial-indexer"
          );
          
          // Run indexing in background - don't block the response
          indexBusinessFinancialData(businessId).catch((err) => {
            console.error("[Agent] Background indexing failed:", err);
          });
        }

        return c.json({
          success: true,
          data: {
            businessId,
            generatedAt: snapshot.generatedAt,
            kpis: snapshot.kpis,
          },
        });
      } catch (error) {
        console.error("[Agent Dashboard Refresh Error]", error);
        return c.json(
          {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to refresh dashboard context",
          },
          500
        );
      }
    }
  )

  /**
   * GET /api/agent/health
   * Health check endpoint
   */
  .get("/health", async (c) => {
    const upstashConfigured = isUpstashConfigured();
    const geminiConfigured = !!process.env.GOOGLE_GEMINI_API_KEY;
    const elevenlabsConfigured =
      !!process.env.ELEVENLABS_API_KEY && !!process.env.ELEVENLABS_VOICE_ID;
    
    return c.json({
      status: upstashConfigured && geminiConfigured ? "ok" : "partial",
      timestamp: new Date().toISOString(),
      config: {
        upstash: upstashConfigured,
        gemini: geminiConfigured,
        redis: isRedisConfigured(),
        vector: isVectorConfigured(),
        elevenlabs: elevenlabsConfigured,
        redisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        redisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        vectorUrl: !!process.env.UPSTASH_VECTOR_REST_URL,
        vectorToken: !!process.env.UPSTASH_VECTOR_REST_TOKEN,
      }
    });
  });

export default app;
