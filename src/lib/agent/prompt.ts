/**
 * Prompt Engineering
 *
 * Grounded prompts that enforce RAG behavior.
 * LLM must ONLY answer from retrieved context.
 */

import { RAGContext, ConversationContext } from "./types";
import { formatContextForPrompt } from "./rag";
import { formatConversationForPrompt } from "./memory";

/**
 * System prompt for the voice financial agent
 */
const SYSTEM_PROMPT = `You are a voice-enabled financial assistant for a business accounting application.

CRITICAL RULES:
1. You can ONLY answer using the provided context below. Do NOT use external knowledge.
2. If the context doesn't contain enough information, say "I don't have enough data to answer that."
3. Keep responses short, clear, and spoken-friendly (1-3 sentences).
4. Be actionable - tell the user what they can DO.
5. Use simple language, no jargon.
6. Format numbers as spoken words when appropriate (e.g., "five thousand dollars").
7. Never make up data, transactions, or financial figures.
8. If asked about something not in context, redirect to what you CAN help with.

You are tactical - focused on "what should I do now?" type questions.`;

/**
 * Build the complete prompt for the LLM
 */
export function buildPrompt(
  query: string,
  ragContext: RAGContext,
  conversationContext: ConversationContext,
  dashboardContext?: string
): string {
  const contextSection = formatContextForPrompt(ragContext);
  const historySection = formatConversationForPrompt(conversationContext);

  let prompt = `${SYSTEM_PROMPT}\n\n`;

  if (dashboardContext && dashboardContext.trim()) {
    prompt += `=== DASHBOARD SNAPSHOT (CACHED) ===\n${dashboardContext.trim()}\n\n`;
  }

  prompt += `=== RETRIEVED FINANCIAL DATA ===\n${contextSection}\n\n`;

  if (historySection) {
    prompt += `=== RECENT CONVERSATION ===\n${historySection}\n\n`;
  }

  prompt += `=== CURRENT QUESTION ===\nUser: ${query}\n\n`;
  prompt += `Assistant (respond concisely, using ONLY the data above):`;

  return prompt;
}

/**
 * Build a prompt for when no context is available
 */
export function buildNoContextPrompt(query: string): string {
  return `${SYSTEM_PROMPT}

The user asked: "${query}"

However, I don't have any relevant financial data to answer this question.

Please respond appropriately, acknowledging you don't have the data and suggesting what you CAN help with (like transactions, expenses, revenue, cash flow).

Assistant (keep it brief and helpful):`;
}
