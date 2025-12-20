/**
 * Agent Memory Management
 *
 * Manages conversation history and session state via Redis.
 * Provides context for multi-turn conversations.
 */

import {
  getConversationHistory,
  addToConversation,
  createSession,
  getSession,
  updateSessionActivity,
  SessionData,
} from "../upstash/redis";
import { ConversationContext, AgentConfig, DEFAULT_AGENT_CONFIG } from "./types";

/**
 * Initialize or resume a session
 * Returns a default session if Redis is unavailable
 */
export async function initializeSession(
  sessionId: string,
  businessId: string,
  userId: string
): Promise<SessionData> {
  try {
    let session = await getSession(sessionId);

    if (!session) {
      await createSession(sessionId, { businessId, userId });
      session = await getSession(sessionId);
    } else {
      await updateSessionActivity(sessionId);
    }

    // If Redis failed, return a default in-memory session
    if (!session) {
      return {
        businessId,
        userId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
    }

    return session;
  } catch (error) {
    console.error("[Memory] Session initialization failed, using fallback:", error instanceof Error ? error.message : error);
    // Return a fallback session so the agent can still work
    return {
      businessId,
      userId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
  }
}

/**
 * Get conversation context for prompt building
 */
export async function getConversationContext(
  businessId: string,
  sessionId: string,
  config: AgentConfig = DEFAULT_AGENT_CONFIG
): Promise<ConversationContext> {
  try {
    const history = await getConversationHistory(
      businessId,
      sessionId,
      config.maxConversationHistory
    );

    return {
      recentMessages: history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };
  } catch (error) {
    console.error("[Memory] Failed to get conversation context:", error instanceof Error ? error.message : error);
    return { recentMessages: [] };
  }
}

/**
 * Save a message to conversation history
 */
export async function saveMessage(
  businessId: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  try {
    await addToConversation(businessId, sessionId, { role, content });
  } catch (error) {
    console.error("[Memory] Failed to save message:", error instanceof Error ? error.message : error);
    // Non-critical - continue without saving
  }
}

/**
 * Format conversation history for prompt
 */
export function formatConversationForPrompt(
  context: ConversationContext
): string {
  if (context.recentMessages.length === 0) {
    return "";
  }

  return context.recentMessages
    .map(
      (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    )
    .join("\n");
}
