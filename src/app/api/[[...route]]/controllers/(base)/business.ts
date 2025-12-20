import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";
import { TIER_LIMITS } from "@/lib/subscription-utils";

const app = new Hono()
  // Get all businesses for current user
  .get("/", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const businesses = await db.business.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ data: businesses });
  })

  // Get single business
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const business = await db.business.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: {
          select: {
            transactions: true,
            ledgerAccounts: true,
            categories: true,
          },
        },
      },
    });

    if (!business) {
      return c.json({ error: "Business not found" }, 404);
    }

    return c.json({ data: business });
  })

  // Create business
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        taxId: z.string().optional(),
        currency: z.string().default("USD"),
        fiscalYearStart: z.number().min(1).max(12).default(1),
      })
    ),
    async (c) => {
      const data = c.req.valid("json");
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get user's subscription tier and count existing businesses
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { subscriptionTier: true },
      });

      const tier = dbUser?.subscriptionTier || "FREE";
      const tierLimits = TIER_LIMITS[tier];
      
      // Count existing businesses
      const businessCount = await db.business.count({
        where: { userId: user.id },
      });

      // Check if user has reached their business limit
      if (tierLimits.businessAccountsLimit !== -1 && businessCount >= tierLimits.businessAccountsLimit) {
        const upgradeMessage = tier === "FREE" 
          ? "Upgrade to Pro for up to 3 business accounts, or Business for unlimited."
          : tier === "PRO"
          ? "Upgrade to Business for unlimited business accounts."
          : "";
        
        return c.json({ 
          error: `You have reached your limit of ${tierLimits.businessAccountsLimit} business account${tierLimits.businessAccountsLimit === 1 ? '' : 's'}. ${upgradeMessage}` 
        }, 403);
      }

      const business = await db.business.create({
        data: {
          ...data,
          userId: user.id,
        },
      });

      return c.json({ data: business }, 201);
    }
  )

  // Update business
  .patch(
    "/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        taxId: z.string().optional(),
        currency: z.string().optional(),
        fiscalYearStart: z.number().min(1).max(12).optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const business = await db.business.updateMany({
        where: { id, userId: user.id },
        data,
      });

      if (business.count === 0) {
        return c.json({ error: "Business not found" }, 404);
      }

      return c.json({ message: "Business updated successfully" });
    }
  )

  // Delete business
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const business = await db.business.deleteMany({
      where: { id, userId: user.id },
    });

    if (business.count === 0) {
      return c.json({ error: "Business not found" }, 404);
    }

    return c.json({ message: "Business deleted successfully" });
  });

export default app;
