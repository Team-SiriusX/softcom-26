/**
 * Store Results Node - Persists simulation results to Redis
 */

import { RedisCache } from "../utils/redis-cache";
import type { SimulatorState } from "../state/simulator-state";

export async function storeResultsNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  if (!state.scenario || !state.realityTimeline || !state.simulationTimeline || !state.impact || !state.verdict) {
    return {
      errors: [...(state.errors || []), "Missing required data for storing results"],
    };
  }

  try {
    const redis = new RedisCache();

    const result = {
      query: state.query,
      businessId: state.businessId,
      scenario: state.scenario,
      realityTimeline: state.realityTimeline,
      simulationTimeline: state.simulationTimeline,
      impact: state.impact,
      verdict: state.verdict,
      timestamp: state.timestamp,
      processingSteps: state.processingSteps,
    };

    // Generate unique simulation ID
    const simulationId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store simulation in Redis
    await redis.storeSimulation(state.businessId, simulationId, result);

    console.log("✅ Results stored in Redis:", simulationId);

    return {
      processingSteps: [...state.processingSteps, `Results stored (ID: ${simulationId})`],
    };
  } catch (error) {
    console.error("❌ Store results error:", error);
    return {
      errors: [
        ...(state.errors || []),
        `Failed to store results: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}
