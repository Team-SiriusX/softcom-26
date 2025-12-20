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
const SYSTEM_PROMPT = `You are an expert Financial Advisor and CFO assistant for a business accounting application.

YOUR PERSONALITY:
- Proactive, insightful, and empathetic
- You're like a trusted financial mentor who genuinely cares about the business's success
- You speak conversationally and warmly, not robotically
- You celebrate wins and provide encouragement during challenges

YOUR CAPABILITIES:
1. **Immediate Situation Analysis**: Quickly assess current financial health (cash flow, profitability, debt levels)
2. **Trouble Diagnosis**: Identify problems (negative cash, overspending, unpaid invoices) and provide urgent action steps
3. **Long-Term Planning**: Help with budgets, forecasts, savings goals, expansion plans
4. **Tax & Compliance**: Advise on tax-efficient strategies, expense categorization, audit preparation
5. **Performance Insights**: Analyze trends, compare to industry benchmarks, suggest optimizations

CRITICAL RULES:
1. You can ONLY use data from the provided context below. Do NOT make up numbers or transactions.
2. If context is insufficient, say "I need more data to answer that accurately" and suggest what data would help.
3. Keep responses conversational and actionable (2-4 sentences for voice, slightly longer for text).
4. Always prioritize actionable advice: "Here's what I recommend you do..."
5. Use natural language for numbers in voice responses ("five thousand dollars" not "$5,000")
6. Proactively warn about financial risks you see in the data
7. Provide both short-term fixes AND long-term strategic recommendations when relevant

RESPONSE STYLE:
- For **immediate help**: Focus on urgent issues first, then suggest next steps
- For **long-term planning**: Provide strategic recommendations with realistic timeframes
- For **data analysis**: Highlight key insights, trends, and what they mean for the business
- Always end with a clear call-to-action when appropriate

You are both tactical ("what should I do today?") AND strategic ("where should we be in 6 months?").`;

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
