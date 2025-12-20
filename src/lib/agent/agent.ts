/**
 * Main Agent Orchestrator
 *
 * Coordinates RAG, memory, and LLM to produce grounded responses.
 * Single entry point for agent interactions.
 *
 * Performance optimizations:
 * - Parallel fetching of context (RAG, dashboard, conversation)
 * - Fire-and-forget logging (non-blocking)
 * - Cached GenAI model instance
 * - Minimal console logging in production
 */

import {
  AgentRequest,
  AgentResponse,
  AgentConfig,
  DEFAULT_AGENT_CONFIG,
} from "./types";
import { retrieveContext, determineConfidence } from "./rag";
import {
  initializeSession,
  getConversationContext,
  saveMessage,
} from "./memory";
import { buildPrompt, buildNoContextPrompt } from "./prompt";
import { getDashboardContextForAgent } from "./dashboard-context";
import { logAction } from "../upstash/redis";

const IS_DEV = process.env.NODE_ENV === "development";

// Cached instances for performance
let genAIInstance: any | null = null;
let cachedModel: any | null = null;

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

function getModel(config: AgentConfig): any {
  if (!cachedModel) {
    const genAI = genAIInstance;
    if (!genAI) throw new Error("GenAI not initialized");
    cachedModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: 4096, // Allow complete responses without truncation
      },
    });
  }
  return cachedModel;
}

// Fire-and-forget helper - doesn't block execution
function fireAndForget(promise: Promise<unknown>): void {
  promise.catch((err) => {
    if (IS_DEV) console.error("[Agent] Background task failed:", err);
  });
}

/**
 * Process a user query through the RAG agent
 */
export async function processAgentQuery(
  request: AgentRequest,
  config: AgentConfig = DEFAULT_AGENT_CONFIG
): Promise<AgentResponse> {
  const startTime = Date.now();
  const { query, sessionId, businessId, userId } = request;

  if (IS_DEV) {
    console.log("[Agent] Processing query:", query.slice(0, 50));
  }

  try {
    // Initialize GenAI early (cached after first call)
    const genAIPromise = getGenAI();

    // 1. Initialize session and save user message in parallel (both are non-blocking for main flow)
    const sessionPromise = initializeSession(sessionId, businessId, userId);

    // 2. Fetch all context sources in parallel - this is the main optimization
    const [ragContext, dashboard, conversationContext] = await Promise.all([
      retrieveContext(query, businessId, config),
      getDashboardContextForAgent(businessId, query),
      getConversationContext(businessId, sessionId, config),
    ]);

    // Ensure session is initialized before saving message
    await sessionPromise;

    // Save user message (fire-and-forget - don't block LLM generation)
    fireAndForget(saveMessage(businessId, sessionId, "user", query));

    const dashboardContextText = dashboard.contextText;

    if (IS_DEV) {
      console.log("[Agent] Context fetched:", {
        ragChunks: ragContext.chunks.length,
        hasDashboard: !!dashboardContextText,
        conversationMsgs: conversationContext.recentMessages.length,
      });
    }

    // 3. Build the prompt (synchronous - fast)
    const hasAnyContext = ragContext.hasContext || !!dashboardContextText;
    const prompt = hasAnyContext
      ? buildPrompt(
          query,
          ragContext,
          conversationContext,
          dashboardContextText
        )
      : buildNoContextPrompt(query);

    // 4. Generate response from LLM
    await genAIPromise; // Ensure GenAI is ready
    const model = getModel(config);
    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    if (IS_DEV) {
      console.log("[Agent] Response generated:", answer.length, "chars");
    }

    // 5. Determine confidence (synchronous - fast)
    const confidence = determineConfidence(ragContext);

    // 6. Fire-and-forget: save assistant response and log action
    fireAndForget(saveMessage(businessId, sessionId, "assistant", answer));
    fireAndForget(
      logAction(businessId, {
        action: "agent_query",
        input: query,
        output: answer,
        context: ragContext.chunks.map((c) => c.slice(0, 100)),
        latencyMs: Date.now() - startTime,
        success: true,
      })
    );

    return {
      answer,
      sources: ragContext.sources,
      confidence,
      sessionId,
    };
  } catch (error) {
    // Fire-and-forget error logging
    fireAndForget(
      logAction(businessId, {
        action: "agent_query",
        input: query,
        output: "",
        context: [],
        latencyMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    );

    throw error;
  }
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
