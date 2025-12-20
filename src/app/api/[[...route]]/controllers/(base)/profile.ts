import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";

const app = new Hono()
  // Get current user profile
  .get("/", async (c) => {
    const user = await currentUser();
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ data: profile });
  })

  // Update user profile
  .patch(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().optional().nullable(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { name, image } = c.req.valid("json");

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(image !== undefined && { image }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          subscriptionTier: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return c.json({ data: updatedUser });
    }
  );

export default app;
