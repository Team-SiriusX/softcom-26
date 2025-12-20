import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";

const app = new Hono()
  // Get all clients for a business
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        isActive: z.string().optional(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const { businessId, isActive } = c.req.valid("query");

      // Verify user owns this business
      const business = await db.business.findFirst({
        where: { id: businessId, userId: user.id },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      const clients = await db.client.findMany({
        where: {
          businessId,
          ...(isActive ? { isActive: isActive === "true" } : {}),
        },
        include: {
          _count: {
            select: { invoices: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return c.json({ data: clients });
    }
  )

  // Get single client
  .get("/:id", async (c) => {
    const user = await currentUser();
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");

    const client = await db.client.findFirst({
      where: {
        id,
        business: { userId: user.id },
      },
      include: {
        invoices: {
          orderBy: { issueDate: "desc" },
          take: 10,
        },
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    return c.json({ data: client });
  })

  // Create client
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        taxId: z.string().optional(),
        notes: z.string().optional(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const data = c.req.valid("json");

      // Verify user owns this business
      const business = await db.business.findFirst({
        where: { id: data.businessId, userId: user.id },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      const client = await db.client.create({
        data,
      });

      return c.json({ data: client }, 201);
    }
  )

  // Update client
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
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const id = c.req.param("id");
      const data = c.req.valid("json");

      // Verify user owns this client
      const existingClient = await db.client.findFirst({
        where: {
          id,
          business: { userId: user.id },
        },
      });

      if (!existingClient) {
        return c.json({ error: "Client not found" }, 404);
      }

      const client = await db.client.update({
        where: { id },
        data,
      });

      return c.json({ data: client });
    }
  )

  // Delete client
  .delete("/:id", async (c) => {
    const user = await currentUser();
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");

    // Verify user owns this client
    const existingClient = await db.client.findFirst({
      where: {
        id,
        business: { userId: user.id },
      },
    });

    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }

    await db.client.delete({
      where: { id },
    });

    return c.json({ success: true });
  });

export default app;
