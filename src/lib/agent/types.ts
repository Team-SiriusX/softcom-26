/**
 * Agent Type Definitions
 *
 * Clean, strict types for the RAG agent system.
 */

export interface AgentRequest {
  query: string;
  sessionId: string;
  businessId: string;
  userId: string;
}

export interface AgentResponse {
  answer: string;
  sources: AgentSource[];
  confidence: "high" | "medium" | "low" | "none";
  sessionId: string;
}

export interface AgentSource {
  text: string;
  source: string;
  score: number;
}

export interface RAGContext {
  chunks: string[];
  sources: AgentSource[];
  hasContext: boolean;
}

export interface ConversationContext {
  recentMessages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface AgentConfig {
  maxContextChunks: number;
  minSimilarityScore: number;
  maxConversationHistory: number;
  temperature: number;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxContextChunks: 5,
  minSimilarityScore: 0.7,
  maxConversationHistory: 6,
  temperature: 0.3,
};
