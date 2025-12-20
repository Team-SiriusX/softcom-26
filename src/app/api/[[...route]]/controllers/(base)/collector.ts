/**
 * CollectorAI API Controller
 * Hono routes for invoice collection agent
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { runCollectorAI } from "@/lib/agent/collector/langgraph-agent";

const app = new Hono()
  /**
   * POST /api/collector/run
   * Manually trigger CollectorAI for a business
   */
  .post(
    "/run",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { businessId } = c.req.valid("json");

      // Verify user owns this business
      const business = await db.business.findFirst({
        where: {
          id: businessId,
          userId: user.id,
        },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      // Run the agent
      try {
        const result = await runCollectorAI(businessId);
        return c.json(result);
      } catch (error) {
        return c.json(
          { error: error instanceof Error ? error.message : "Failed to run CollectorAI" },
          500
        );
      }
    }
  )

  /**
   * GET /api/collector/history/:businessId
   * Get execution history for a business
   */
  .get("/history/:businessId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businessId = c.req.param("businessId");

    // Verify user owns this business
    const business = await db.business.findFirst({
      where: {
        id: businessId,
        userId: user.id,
      },
    });

    if (!business) {
      return c.json({ error: "Business not found" }, 404);
    }

    const history = await db.agentExecutionLog.findMany({
      where: {
        businessId,
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 20,
    });

    return c.json({ history });
  })

  /**
   * GET /api/collector/invoices/:businessId
   * Get invoices needing attention
   */
  .get("/invoices/:businessId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businessId = c.req.param("businessId");

    // Verify user owns this business
    const business = await db.business.findFirst({
      where: {
        id: businessId,
        userId: user.id,
      },
    });

    if (!business) {
      return c.json({ error: "Business not found" }, 404);
    }

    const now = new Date();
    
    const invoices = await db.invoice.findMany({
      where: {
        businessId,
        status: {
          in: ["SENT", "OVERDUE", "PARTIAL"],
        },
        dueDate: {
          lte: now,
        },
      },
      include: {
        client: true,
        collectionActions: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        paymentPlan: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return c.json({ invoices });
  })

  /**
   * GET /api/collector/stats/:businessId
   * Get collection statistics
   */
  .get("/stats/:businessId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businessId = c.req.param("businessId");

    // Verify user owns this business
    const business = await db.business.findFirst({
      where: {
        id: businessId,
        userId: user.id,
      },
    });

    if (!business) {
      return c.json({ error: "Business not found" }, 404);
    }

    const [totalInvoices, overdueInvoices, recentActions, recentExecutions] = await Promise.all([
      db.invoice.count({
        where: { businessId },
      }),
      db.invoice.count({
        where: {
          businessId,
          status: "OVERDUE",
        },
      }),
      db.collectionAction.count({
        where: {
          invoice: {
            businessId,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      db.agentExecutionLog.findMany({
        where: {
          businessId,
          status: "COMPLETED",
        },
        orderBy: {
          startedAt: "desc",
        },
        take: 10,
      }),
    ]);

    const totalEmailsSent = recentExecutions.reduce((sum, exec) => sum + exec.emailsSent, 0);
    const avgDuration = recentExecutions.length > 0
      ? recentExecutions.reduce((sum, exec) => sum + (exec.durationMs || 0), 0) / recentExecutions.length
      : 0;

    const successRate = recentExecutions.length > 0
      ? (recentExecutions.filter(e => e.status === "SUCCESS").length / recentExecutions.length) * 100
      : 0;

    return c.json({
      totalInvoices,
      overdueCount: overdueInvoices,
      emailsSent: totalEmailsSent,
      avgExecutionTime: Math.round(avgDuration),
      successRate,
      lastRun: recentExecutions[0]?.startedAt || null,
    });
  })

  /**
   * GET /api/collector/actions/:businessId
   * Get detailed collection actions for a business (optionally filtered by executionId)
   */
  .get("/actions/:businessId", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businessId = c.req.param("businessId");
    const executionId = c.req.query("executionId");

    // Verify user owns this business
    const business = await db.business.findFirst({
      where: {
        id: businessId,
        userId: user.id,
      },
    });

    if (!business) {
      return c.json({ error: "Business not found" }, 404);
    }

    // Build where clause
    const where: any = {
      invoice: {
        businessId,
      },
    };

    if (executionId) {
      where.executionLogId = executionId;
    }

    try {
      const actions = await db.collectionAction.findMany({
        where,
        include: {
          invoice: {
            include: {
              client: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100,
      });

      return c.json({
        actions,
        total: actions.length,
      });
    } catch (error) {
      console.error("Error fetching collection actions:", error);
      return c.json(
        { error: "Failed to fetch collection actions", details: error instanceof Error ? error.message : "Unknown error" },
        500
      );
    }
  });

export default app;
