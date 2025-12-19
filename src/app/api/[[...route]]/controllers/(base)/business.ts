import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";

const app = new Hono()
  // Get all businesses for current user
  .get("/", async (c) => {
    // TODO: Get userId from auth session
    const userId = "temp-user-id"; // Replace with actual auth

    const businesses = await db.business.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ data: businesses });
  })

  // Get single business
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const userId = "temp-user-id"; // Replace with actual auth

    const business = await db.business.findFirst({
      where: { id, userId },
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
      const userId = "temp-user-id"; // Replace with actual auth

      const business = await db.business.create({
        data: {
          ...data,
          userId,
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
      const userId = "temp-user-id"; // Replace with actual auth

      const business = await db.business.updateMany({
        where: { id, userId },
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
    const userId = "temp-user-id"; // Replace with actual auth

    const business = await db.business.deleteMany({
      where: { id, userId },
    });

    if (business.count === 0) {
      return c.json({ error: "Business not found" }, 404);
    }

    return c.json({ message: "Business deleted successfully" });
  });

export default app;
