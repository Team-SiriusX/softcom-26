/**
 * Financial Simulator API Controller
 * Handles "what-if" scenario simulations using LangGraph + Gemini
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { currentUser } from "@/lib/current-user";
import { runSimulation } from "@/lib/agent/simulator/simulator-graph";
import { RedisCache } from "@/lib/agent/simulator/utils/redis-cache";

const app = new Hono()
  // Run a new simulation
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
        query: z.string().min(10).max(500),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { businessId, query } = c.req.valid("json");

      try {
        console.log("📊 Running financial simulation:", { businessId, query });

        const result = await runSimulation(businessId, query);

        if (!result.success) {
          return c.json({ error: result.error || "Simulation failed" }, 500);
        }

        return c.json(result.data);
      } catch (error) {
        console.error("Simulation API error:", error);
        return c.json(
          { error: error instanceof Error ? error.message : "Failed to run simulation" },
          500
        );
      }
    }
  )

  // Get simulation history
  .get("/history/:businessId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businessId = c.req.param("businessId");

    try {
      const redis = new RedisCache();
      const history = await redis.getSimulationHistory(businessId, 20);

      // Fetch full simulation data for each ID
      const simulations = await Promise.all(
        history.map(async (id) => {
          const sim = await redis.getSimulation(businessId, id);
          return sim ? { id, ...sim } : null;
        })
      );

      return c.json({
        simulations: simulations.filter((s) => s !== null),
      });
    } catch (error) {
      console.error("History fetch error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Failed to fetch history" },
        500
      );
    }
  })

  // Get specific simulation by ID
  .get("/:businessId/:simulationId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businessId = c.req.param("businessId");
    const simulationId = c.req.param("simulationId");

    try {
      const redis = new RedisCache();
      const simulation = await redis.getSimulation(businessId, simulationId);

      if (!simulation) {
        return c.json({ error: "Simulation not found" }, 404);
      }

      return c.json(simulation);
    } catch (error) {
      console.error("Simulation fetch error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Failed to fetch simulation" },
        500
      );
    }
  })

  // Clear cache for business
  .delete("/cache/:businessId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businessId = c.req.param("businessId");

    try {
      const redis = new RedisCache();
      await redis.clearBusinessCache(businessId);

      return c.json({ success: true, message: "Cache cleared" });
    } catch (error) {
      console.error("Cache clear error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Failed to clear cache" },
        500
      );
    }
  });

export default app;
