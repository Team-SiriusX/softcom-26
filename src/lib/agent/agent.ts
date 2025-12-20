/**
 * Main Agent Orchestrator
 *
 * Coordinates RAG, memory, and LLM to produce grounded responses.
 * Single entry point for agent interactions.
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
      throw new Error("@google/generative-ai package not installed. Run: pnpm add @google/generative-ai");
    }
  }
  return genAIInstance;
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

  console.log("[Agent] Processing query:", { query: query.slice(0, 50), businessId, sessionId });

  try {
    // 1. Initialize/resume session
    console.log("[Agent] Initializing session...");
    await initializeSession(sessionId, businessId, userId);

    // 2. Save user message to conversation history
    console.log("[Agent] Saving user message...");
    await saveMessage(businessId, sessionId, "user", query);

    // 3. Retrieve relevant context from vector store
    console.log("[Agent] Retrieving RAG context...");
    const ragContext = await retrieveContext(query, businessId, config);
    console.log("[Agent] RAG context:", { hasContext: ragContext.hasContext, chunks: ragContext.chunks.length });

    // 3b. Retrieve dashboard snapshot context (Redis keyword search)
    const dashboard = await getDashboardContextForAgent(businessId, query);
    const dashboardContextText = dashboard.contextText;
    console.log("[Agent] Dashboard context:", {
      hasDashboardContext: !!dashboardContextText,
      snapshot: dashboard.snapshot ? "cached-or-built" : "none",
    });

    // 4. Get conversation history for context
    const conversationContext = await getConversationContext(
      businessId,
      sessionId,
      config
    );

    console.log("[Agent] Conversation context:", {
      recentMessages: conversationContext.recentMessages.length,
    });

    // 5. Build the prompt
    const hasAnyContext = ragContext.hasContext || !!dashboardContextText;
    const prompt = hasAnyContext
      ? buildPrompt(query, ragContext, conversationContext, dashboardContextText)
      : buildNoContextPrompt(query);

    console.log("[Agent] Prompt built:", {
      length: prompt.length,
      hasContext: ragContext.hasContext,
    });

    // 6. Generate response from LLM
    console.log("[Agent] Generating LLM response...");
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: 300, // Keep responses concise for voice
      },
    });

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    console.log("[Agent] LLM response received:", {
      length: answer.length,
    });

    // 7. Save assistant response to conversation history
    await saveMessage(businessId, sessionId, "assistant", answer);

    // 8. Determine confidence level
    const confidence = determineConfidence(ragContext);

    // 9. Log the action
    await logAction(businessId, {
      action: "agent_query",
      input: query,
      output: answer,
      context: ragContext.chunks.map((c) => c.slice(0, 100)),
      latencyMs: Date.now() - startTime,
      success: true,
    });

    return {
      answer,
      sources: ragContext.sources,
      confidence,
      sessionId,
    };
  } catch (error) {
    // Log the error
    await logAction(businessId, {
      action: "agent_query",
      input: query,
      output: "",
      context: [],
      latencyMs: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
