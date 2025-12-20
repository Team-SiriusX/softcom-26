/**
 * Semantic Response Cache
 *
 * Caches LLM responses with semantic similarity matching.
 * Prevents redundant expensive LLM calls for similar questions.
 *
 * Example:
 * - "What are my expenses?" → Cache hit for "Show me my spending"
 * - Uses cosine similarity on query embeddings
 * - 15-minute TTL for financial data freshness
 */

import { getRedisClient } from "../upstash/redis";
import { generateEmbedding } from "./embeddings";

const CACHE_TTL_SECONDS = 60 * 15; // 15 minutes
const SIMILARITY_THRESHOLD = 0.92; // High threshold for cache hits
const MAX_CACHE_ENTRIES_PER_BUSINESS = 50; // Prevent unbounded growth

interface CachedResponse {
  query: string;
  embedding: number[];
  answer: string;
  sources: any[];
  confidence: string;
  sessionId: string;
  timestamp: number;
}

function cacheKey(businessId: string) {
  return `agent:cache:${businessId}`;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Check cache for semantically similar query
 * Returns cached response if similarity > threshold
 */
export async function getCachedResponse(
  businessId: string,
  query: string
): Promise<{ answer: string; sources: any[]; confidence: string; sessionId: string } | null> {
  try {
    const redis = getRedisClient();
    const key = cacheKey(businessId);

    // Get all cached responses
    const cached = await redis.get(key) as CachedResponse[] | null;
    if (!cached || cached.length === 0) return null;

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Find best match
    let bestMatch: CachedResponse | null = null;
    let bestScore = 0;

    for (const entry of cached) {
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore && score >= SIMILARITY_THRESHOLD) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      console.log(`[Cache] HIT! Similarity: ${bestScore.toFixed(3)} for query: "${query}"`);
      return {
        answer: bestMatch.answer,
        sources: bestMatch.sources,
        confidence: bestMatch.confidence,
        sessionId: bestMatch.sessionId,
      };
    }

    console.log(`[Cache] MISS. Best similarity: ${bestScore.toFixed(3)}`);
    return null;
  } catch (error) {
    console.error("[Cache] Error getting cached response:", error);
    return null;
  }
}

/**
 * Cache a new response
 */
export async function cacheResponse(
  businessId: string,
  query: string,
  answer: string,
  sources: any[],
  confidence: string,
  sessionId: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = cacheKey(businessId);

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    const newEntry: CachedResponse = {
      query,
      embedding: queryEmbedding,
      answer,
      sources,
      confidence,
      sessionId,
      timestamp: Date.now(),
    };

    // Get existing cache
    let cached = (await redis.get(key)) as CachedResponse[] | null;
    if (!cached) cached = [];

    // Add new entry at the beginning
    cached.unshift(newEntry);

    // Trim to max size (FIFO eviction)
    if (cached.length > MAX_CACHE_ENTRIES_PER_BUSINESS) {
      cached = cached.slice(0, MAX_CACHE_ENTRIES_PER_BUSINESS);
    }

    // Save back to Redis with TTL
    await redis.set(key, cached, { ex: CACHE_TTL_SECONDS });

    console.log(`[Cache] Stored response for: "${query.slice(0, 50)}..."`);
  } catch (error) {
    console.error("[Cache] Error caching response:", error);
    // Non-critical - don't throw
  }
}

/**
 * Invalidate cache for a business
 * Call this when financial data changes (new transaction, etc.)
 */
export async function invalidateCache(businessId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(cacheKey(businessId));
    console.log(`[Cache] Invalidated cache for business: ${businessId}`);
  } catch (error) {
    console.error("[Cache] Error invalidating cache:", error);
  }
}

/**
 * Clear old entries from cache
 * Call periodically to prevent stale data
 */
export async function pruneCache(businessId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = cacheKey(businessId);

    const cached = (await redis.get(key)) as CachedResponse[] | null;
    if (!cached) return;

    // Remove entries older than TTL
    const now = Date.now();
    const fresh = cached.filter(
      (entry) => now - entry.timestamp < CACHE_TTL_SECONDS * 1000
    );

    if (fresh.length < cached.length) {
      await redis.set(key, fresh, { ex: CACHE_TTL_SECONDS });
      console.log(
        `[Cache] Pruned ${cached.length - fresh.length} stale entries`
      );
    }
  } catch (error) {
    console.error("[Cache] Error pruning cache:", error);
  }
}
