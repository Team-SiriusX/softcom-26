/**
 * Redis Cache Utilities for Simulator
 * Handles caching of timelines and simulation results
 */

import { Redis } from "@upstash/redis";
import type { TimelinePoint } from "../state/simulator-state";

export class RedisCache {
  private redis: Redis;

  constructor() {
    // Use the existing environment variables from your project
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required. Check your .env.local file.");
    }

    this.redis = new Redis({ url, token });
  }

  /**
   * Get cached reality timeline
   */
  async getRealityTimeline(businessId: string): Promise<TimelinePoint[] | null> {
    try {
      const cacheKey = `reality-timeline:${businessId}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return typeof cached === "string" ? JSON.parse(cached) : (cached as TimelinePoint[]);
      }

      return null;
    } catch (error) {
      console.error("Redis getRealityTimeline error:", error);
      return null;
    }
  }

  /**
   * Set reality timeline cache (1 hour TTL)
   */
  async setRealityTimeline(businessId: string, timeline: TimelinePoint[]): Promise<void> {
    try {
      const cacheKey = `reality-timeline:${businessId}`;
      await this.redis.set(cacheKey, JSON.stringify(timeline), { ex: 3600 }); // 1 hour
    } catch (error) {
      console.error("Redis setRealityTimeline error:", error);
    }
  }

  /**
   * Store simulation result (7 days TTL)
   */
  async storeSimulation(businessId: string, simulationId: string, result: any): Promise<void> {
    try {
      await this.redis.set(`simulation:${businessId}:${simulationId}`, JSON.stringify(result), {
        ex: 604800, // 7 days
      });

      // Add to history list
      await this.redis.lpush(`simulations:${businessId}:history`, simulationId);
      await this.redis.ltrim(`simulations:${businessId}:history`, 0, 19); // Keep last 20
    } catch (error) {
      console.error("Redis storeSimulation error:", error);
      throw error;
    }
  }

  /**
   * Get simulation by ID
   */
  async getSimulation(businessId: string, simulationId: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(`simulation:${businessId}:${simulationId}`);
      return cached ? (typeof cached === "string" ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.error("Redis getSimulation error:", error);
      return null;
    }
  }

  /**
   * Get simulation history
   */
  async getSimulationHistory(businessId: string, limit: number = 10): Promise<string[]> {
    try {
      const history = await this.redis.lrange(`simulations:${businessId}:history`, 0, limit - 1);
      return history as string[];
    } catch (error) {
      console.error("Redis getSimulationHistory error:", error);
      return [];
    }
  }

  /**
   * Clear cache for business
   */
  async clearBusinessCache(businessId: string): Promise<void> {
    try {
      await this.redis.del(`reality-timeline:${businessId}`);
    } catch (error) {
      console.error("Redis clearBusinessCache error:", error);
    }
  }
}
