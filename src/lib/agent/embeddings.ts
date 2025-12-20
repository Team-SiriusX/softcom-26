/**
 * Embedding Generation
 *
 * Uses Google Gemini for text embeddings.
 * Clean abstraction over the embedding API.
 */

// Use dynamic import to handle missing package gracefully
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
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const genAI = await getGenAI();
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const genAI = await getGenAI();
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const results = await Promise.all(
    texts.map((text) => model.embedContent(text))
  );

  return results.map((result: any) => result.embedding.values);
}

/**
 * Chunk text into smaller pieces for embedding
 *
 * Rules:
 * - 300-500 tokens per chunk (approx 1200-2000 chars)
 * - One idea per chunk
 * - Preserve sentence boundaries
 */
export function chunkText(text: string, maxChunkSize: number = 1500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 50); // Filter tiny chunks
}
