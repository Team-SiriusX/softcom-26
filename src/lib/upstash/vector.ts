/**
 * Upstash Vector Client
 *
 * Handles embeddings storage and similarity search for RAG.
 * Single index with businessId filtering for multi-tenant isolation.
 */

import { Index } from "@upstash/vector";

let vectorInstance: Index | null = null;

const VECTOR_TIMEOUT_MS = 4000;
const VECTOR_BACKOFF_MS = 60_000;
let vectorDisabledUntil = 0;
let vectorConsecutiveFailures = 0;
let lastVectorErrorLogAt = 0;

function isVectorConfigured(): boolean {
  return !!(
    process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
  );
}

function shouldSkipVector(): boolean {
  return !isVectorConfigured() || Date.now() < vectorDisabledUntil;
}

function recordVectorSuccess() {
  vectorConsecutiveFailures = 0;
  vectorDisabledUntil = 0;
}

function recordVectorFailure(err: unknown) {
  vectorConsecutiveFailures += 1;
  if (vectorConsecutiveFailures >= 2) {
    vectorDisabledUntil = Date.now() + VECTOR_BACKOFF_MS;
  }

  const now = Date.now();
  if (now - lastVectorErrorLogAt > 15_000) {
    lastVectorErrorLogAt = now;
    console.error(
      "[Vector] Request failed:",
      err instanceof Error ? err.message : err
    );
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Vector timeout")), ms);
  });

  try {
    // Prevent unhandled rejections if timeout wins
    promise.catch(() => undefined);
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function getVectorClient(): Index {
  if (!vectorInstance) {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Missing UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN"
      );
    }

    vectorInstance = new Index({ url, token });
  }

  return vectorInstance;
}

/**
 * Vector metadata structure
 * Stored alongside each embedding for retrieval
 */
export interface VectorMetadata {
  businessId: string;
  text: string; // Original chunk text (for context assembly)
  source: string; // Where this came from (e.g., "transaction", "report")
  sourceId?: string; // Reference ID in source system
  category?: string; // Optional categorization
  createdAt: number;
  [key: string]: string | number | undefined; // Index signature for Upstash compatibility
}

/**
 * Search result with metadata
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

/**
 * Upsert a document chunk into the vector index
 */
export async function upsertVector(
  id: string,
  embedding: number[],
  metadata: VectorMetadata
): Promise<void> {
  if (shouldSkipVector()) {
    throw new Error(
      "Upstash Vector is not configured or is temporarily unavailable"
    );
  }
  const index = getVectorClient();

  await withTimeout(
    index.upsert({
    id,
    vector: embedding,
    metadata: metadata as Record<string, string | number>,
    }),
    VECTOR_TIMEOUT_MS
  );
  recordVectorSuccess();
}

/**
 * Batch upsert multiple chunks
 */
export async function upsertVectors(
  items: Array<{
    id: string;
    embedding: number[];
    metadata: VectorMetadata;
  }>
): Promise<void> {
  if (shouldSkipVector()) {
    throw new Error(
      "Upstash Vector is not configured or is temporarily unavailable"
    );
  }
  const index = getVectorClient();

  await withTimeout(
    index.upsert(
      items.map((item) => ({
        id: item.id,
        vector: item.embedding,
        metadata: item.metadata as Record<string, string | number>,
      }))
    ),
    VECTOR_TIMEOUT_MS
  );
  recordVectorSuccess();
}

/**
 * Search for similar vectors with businessId filtering
 * Returns top K results filtered by business
 */
export async function searchVectors(
  embedding: number[],
  businessId: string,
  topK: number = 5
): Promise<VectorSearchResult[]> {
  if (shouldSkipVector()) return [];
  try {
    const index = getVectorClient();

    const results = await withTimeout(
      index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter: `businessId = '${businessId}'`,
      }),
      VECTOR_TIMEOUT_MS
    );
    recordVectorSuccess();

    return results.map((result) => ({
      id: result.id as string,
      score: result.score,
      metadata: result.metadata as unknown as VectorMetadata,
    }));
  } catch (error) {
    // If the index is empty, dimension mismatch, or query fails, return empty array
    recordVectorFailure(error);
    return [];
  }
}

/**
 * Delete vectors by ID
 */
export async function deleteVectors(ids: string[]): Promise<void> {
  if (shouldSkipVector()) {
    throw new Error(
      "Upstash Vector is not configured or is temporarily unavailable"
    );
  }
  const index = getVectorClient();
  await withTimeout(index.delete(ids), VECTOR_TIMEOUT_MS);
  recordVectorSuccess();
}
