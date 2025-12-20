/**
 * Upstash Redis Client
 *
 * Handles session memory, conversation history, and action logging.
 * Edge-safe, no global mutable state.
 */

import { Redis } from "@upstash/redis";

// Lazy singleton pattern - edge safe
let redisInstance: Redis | null = null;

const REDIS_TIMEOUT_MS = 4000;
const REDIS_BACKOFF_MS = 60_000;
let redisDisabledUntil = 0;
let redisConsecutiveFailures = 0;
let lastRedisErrorLogAt = 0;

function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function shouldSkipRedis(): boolean {
  return !isRedisConfigured() || Date.now() < redisDisabledUntil;
}

function recordRedisSuccess() {
  redisConsecutiveFailures = 0;
  redisDisabledUntil = 0;
}

function recordRedisFailure(err: unknown) {
  redisConsecutiveFailures += 1;
  if (redisConsecutiveFailures >= 2) {
    redisDisabledUntil = Date.now() + REDIS_BACKOFF_MS;
  }

  const now = Date.now();
  if (now - lastRedisErrorLogAt > 15_000) {
    lastRedisErrorLogAt = now;
    console.error(
      "[Redis] Request failed:",
      err instanceof Error ? err.message : err
    );
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Redis timeout")), ms);
  });

  try {
    // Prevent unhandled rejections if timeout wins
    promise.catch(() => undefined);
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function redisOp<T>(fn: (redis: Redis) => Promise<T>, fallback: T): Promise<T> {
  if (shouldSkipRedis()) return fallback;

  try {
    const redis = getRedisClient();
    const result = await withTimeout(fn(redis), REDIS_TIMEOUT_MS);
    recordRedisSuccess();
    return result;
  } catch (err) {
    recordRedisFailure(err);
    return fallback;
  }
}

export function getRedisClient(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN"
      );
    }

    redisInstance = new Redis({ url, token });
  }

  return redisInstance;
}

/**
 * Key naming strategy:
 * - agent:session:{sessionId}             → Session metadata
 * - agent:memory:{businessId}:{sessionId} → Conversation history
 * - agent:log:{businessId}:{timestamp}    → Action logs
 */

export const TTL = {
  SESSION: 60 * 60 * 24, // 24 hours
  MEMORY: 60 * 60 * 2, // 2 hours (short-term)
  LOG: 60 * 60 * 24 * 7, // 7 days
} as const;

export const keys = {
  session: (sessionId: string) => `agent:session:${sessionId}`,
  memory: (businessId: string, sessionId: string) =>
    `agent:memory:${businessId}:${sessionId}`,
  log: (businessId: string, timestamp: number) =>
    `agent:log:${businessId}:${timestamp}`,
} as const;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface SessionData {
  businessId: string;
  userId: string;
  createdAt: number;
  lastActiveAt: number;
}

export async function createSession(
  sessionId: string,
  data: Omit<SessionData, "createdAt" | "lastActiveAt">
): Promise<void> {
  const now = Date.now();

  await redisOp(
    (redis) =>
      redis.set(
        keys.session(sessionId),
        { ...data, createdAt: now, lastActiveAt: now },
        { ex: TTL.SESSION }
      ),
    undefined
  );
}

export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  return await redisOp(
    (redis) => redis.get<SessionData>(keys.session(sessionId)),
    null
  );
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const key = keys.session(sessionId);
  const session = await redisOp((redis) => redis.get<SessionData>(key), null);
  if (!session) return;

  await redisOp(
    (redis) =>
      redis.set(
        key,
        { ...session, lastActiveAt: Date.now() },
        { ex: TTL.SESSION }
      ),
    undefined
  );
}

export async function getConversationHistory(
  businessId: string,
  sessionId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  const key = keys.memory(businessId, sessionId);
  const messages = await redisOp(
    (redis) => redis.lrange<ConversationMessage>(key, -limit, -1),
    [] as ConversationMessage[]
  );
  return messages ?? [];
}

export async function addToConversation(
  businessId: string,
  sessionId: string,
  message: Omit<ConversationMessage, "timestamp">
): Promise<void> {
  const key = keys.memory(businessId, sessionId);

  const fullMessage: ConversationMessage = {
    ...message,
    timestamp: Date.now(),
  };

  await redisOp((redis) => redis.rpush(key, fullMessage), undefined);
  await redisOp((redis) => redis.expire(key, TTL.MEMORY), undefined);
  await redisOp((redis) => redis.ltrim(key, -50, -1), undefined); // Keep last 50 messages
}

export interface ActionLog {
  action: string;
  input: string;
  output: string;
  context: string[];
  latencyMs: number;
  success: boolean;
  error?: string;
}

export async function logAction(
  businessId: string,
  log: ActionLog
): Promise<void> {
  const timestamp = Date.now();
  const key = keys.log(businessId, timestamp);

  await redisOp((redis) => redis.set(key, log, { ex: TTL.LOG }), undefined);
}
