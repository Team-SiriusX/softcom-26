/**
 * Streaming Agent Responses
 *
 * Implements streaming for real-time LLM output.
 * Massive perceived performance improvement - user sees results instantly.
 */

import { AgentRequest, AgentConfig, DEFAULT_AGENT_CONFIG } from "./types";
import { retrieveContext, determineConfidence } from "./rag";
import { initializeSession, getConversationContext, saveMessage } from "./memory";
import { buildPrompt, buildNoContextPrompt } from "./prompt";
import { getDashboardContextForAgent } from "./dashboard-context";
import { logAction } from "../upstash/redis";

const IS_DEV = process.env.NODE_ENV === "development";

// Cached GenAI instance
let genAIInstance: any | null = null;

async function getGenAI(): Promise<any> {
  if (!genAIInstance) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_GEMINI_API_KEY");
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      genAIInstance = new GoogleGenerativeAI(apiKey);
    } catch {
      throw new Error(
        "@google/generative-ai package not installed. Run: pnpm add @google/generative-ai"
      );
    }
  }
  return genAIInstance;
}

/**
 * Stream agent response chunk by chunk
 * Returns an async generator for Server-Sent Events
 */
export async function* streamAgentQuery(
  request: AgentRequest,
  config: AgentConfig = DEFAULT_AGENT_CONFIG
): AsyncGenerator<string, void, unknown> {
  const startTime = Date.now();
  const { query, sessionId, businessId, userId } = request;

  if (IS_DEV) {
    console.log("[Agent Stream] Processing query:", query.slice(0, 50));
  }

  try {
    // Initialize GenAI early
    const genAIPromise = getGenAI();

    // Initialize session
    const sessionPromise = initializeSession(sessionId, businessId, userId);

    // Fetch all context sources in parallel
    const [ragContext, dashboard, conversationContext] = await Promise.all([
      retrieveContext(query, businessId, config),
      getDashboardContextForAgent(businessId, query),
      getConversationContext(businessId, sessionId, config),
    ]);

    await sessionPromise;

    // Save user message (fire-and-forget)
    saveMessage(businessId, sessionId, "user", query).catch((err) => {
      if (IS_DEV) console.error("[Agent Stream] Failed to save message:", err);
    });

    const dashboardContextText = dashboard.contextText;

    // Build prompt
    const hasAnyContext = ragContext.hasContext || !!dashboardContextText;
    const prompt = hasAnyContext
      ? buildPrompt(query, ragContext, conversationContext, dashboardContextText)
      : buildNoContextPrompt(query);

    // Get GenAI model
    await genAIPromise;
    const genAI = genAIInstance;
    if (!genAI) throw new Error("GenAI not initialized");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Stable with higher limits
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: 300,
      },
    });

    // Stream response
    const result = await model.generateContentStream(prompt);
    let fullAnswer = "";

    // Yield chunks as they arrive
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullAnswer += chunkText;
      
      // Send SSE event
      yield `data: ${JSON.stringify({ type: "chunk", content: chunkText })}\n\n`;
    }

    // Determine confidence
    const confidence = determineConfidence(ragContext);

    // Yield metadata
    yield `data: ${JSON.stringify({
      type: "metadata",
      sources: ragContext.sources,
      confidence,
      sessionId,
    })}\n\n`;

    // Yield done event
    yield `data: ${JSON.stringify({ type: "done" })}\n\n`;

    // Save assistant response (fire-and-forget)
    saveMessage(businessId, sessionId, "assistant", fullAnswer).catch((err) => {
      if (IS_DEV) console.error("[Agent Stream] Failed to save message:", err);
    });

    // Log action (fire-and-forget)
    logAction(businessId, {
      action: "agent_query_stream",
      input: query,
      output: fullAnswer,
      context: ragContext.chunks.map((c) => c.slice(0, 100)),
      latencyMs: Date.now() - startTime,
      success: true,
    }).catch((err) => {
      if (IS_DEV) console.error("[Agent Stream] Failed to log:", err);
    });
  } catch (error) {
    // Send error event
    yield `data: ${JSON.stringify({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    })}\n\n`;

    // Log error (fire-and-forget)
    logAction(businessId, {
      action: "agent_query_stream",
      input: query,
      output: "",
      context: [],
      latencyMs: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }).catch(() => {});
  }
}
