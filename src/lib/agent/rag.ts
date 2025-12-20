/**
 * RAG (Retrieval-Augmented Generation) Logic
 *
 * Handles vector search and context assembly.
 * Business-scoped data isolation enforced.
 */

import { generateEmbedding } from "./embeddings";
import { searchVectors } from "../upstash/vector";
import {
  RAGContext,
  AgentSource,
  AgentConfig,
  DEFAULT_AGENT_CONFIG,
} from "./types";

/**
 * Retrieve relevant context for a query
 */
export async function retrieveContext(
  query: string,
  businessId: string,
  config: AgentConfig = DEFAULT_AGENT_CONFIG
): Promise<RAGContext> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Search vector store with business filter
  const results = await searchVectors(
    queryEmbedding,
    businessId,
    config.maxContextChunks * 2 // Fetch more, filter by score
  );

  // Filter by minimum similarity score
  const relevantResults = results.filter(
    (r) => r.score >= config.minSimilarityScore
  );

  // Take top K after filtering
  const topResults = relevantResults.slice(0, config.maxContextChunks);

  // Extract chunks and sources
  const chunks = topResults.map((r) => r.metadata.text);
  const sources: AgentSource[] = topResults.map((r) => ({
    text: r.metadata.text.slice(0, 200) + "...",
    source: r.metadata.source,
    score: r.score,
  }));

  return {
    chunks,
    sources,
    hasContext: chunks.length > 0,
  };
}

/**
 * Format retrieved context for the LLM prompt
 */
export function formatContextForPrompt(context: RAGContext): string {
  if (!context.hasContext) {
    return "No relevant financial data found for this query.";
  }

  return context.chunks
    .map((chunk, i) => `[Source ${i + 1}]\n${chunk}`)
    .join("\n\n---\n\n");
}

/**
 * Determine confidence level based on search results
 */
export function determineConfidence(
  context: RAGContext
): "high" | "medium" | "low" | "none" {
  if (!context.hasContext || context.sources.length === 0) {
    return "none";
  }

  const avgScore =
    context.sources.reduce((sum, s) => sum + s.score, 0) /
    context.sources.length;

  if (avgScore >= 0.85 && context.sources.length >= 3) {
    return "high";
  }
  if (avgScore >= 0.75 && context.sources.length >= 2) {
    return "medium";
  }
  return "low";
}
