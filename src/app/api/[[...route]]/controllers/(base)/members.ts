import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";
import { getUserBusinessRole, isBusinessOwner } from "@/lib/business-access";
import { hasPermission } from "@/lib/permissions";
import { BusinessRole } from "@/generated/prisma";

const app = new Hono()
  // Search for users by email (for adding members)
  .get(
    "/search",
    zValidator("query", z.object({ email: z.string().email() })),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { email } = c.req.valid("query");

      // Find user by email
      const foundUser = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      if (!foundUser) {
        return c.json({ error: "User not found with this email" }, 404);
      }

      return c.json({ data: foundUser });
    }
  )

  // Get all members of a business
  .get(
    "/:businessId",
    zValidator("param", z.object({ businessId: z.string() })),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { businessId } = c.req.valid("param");

      // Check if user has access to this business
      const role = await getUserBusinessRole(user.id, businessId);
      if (!role || !hasPermission(role, "VIEW_MEMBERS")) {
        return c.json({ error: "Forbidden" }, 403);
      }

      // Get business owner
      const business = await db.business.findUnique({
        where: { id: businessId },
        include: { user: true },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      // Get all members
      const members = await db.businessMember.findMany({
        where: { businessId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Include owner in the response
      const allMembers = [
        {
          id: "owner",
          role: "OWNER" as BusinessRole,
          status: "ACTIVE" as const,
          user: {
            id: business.user.id,
            name: business.user.name,
            email: business.user.email,
            image: business.user.image,
          },
          joinedAt: business.createdAt,
          createdAt: business.createdAt,
          updatedAt: business.updatedAt,
        },
        ...members,
      ];

      return c.json({ data: allMembers });
    }
  )

  // Add a member to a business
  .post(
    "/:businessId",
    zValidator("param", z.object({ businessId: z.string() })),
    zValidator(
      "json",
      z.object({
        email: z.string().email(),
        role: z.enum(["ADMIN", "ACCOUNTANT", "VIEWER"]),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { businessId } = c.req.valid("param");
      const { email, role } = c.req.valid("json");

      // Check if user has permission to manage members
      const userRole = await getUserBusinessRole(user.id, businessId);
      if (!userRole || !hasPermission(userRole, "MANAGE_MEMBERS")) {
        return c.json({ error: "Forbidden - Only owners and admins can add members" }, 403);
      }

      // Find the user to add by email
      const userToAdd = await db.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        return c.json({ error: "User not found with this email" }, 404);
      }

      // Check if user is the business owner
      const isOwner = await isBusinessOwner(userToAdd.id, businessId);
      if (isOwner) {
        return c.json({ error: "Cannot add business owner as a member" }, 400);
      }

      // Check if already a member
      const existingMember = await db.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: userToAdd.id,
          },
        },
      });

      if (existingMember) {
        return c.json({ error: "User is already a member of this business" }, 400);
      }

      // Create member
      const member = await db.businessMember.create({
        data: {
          businessId,
          userId: userToAdd.id,
          role,
          status: "ACTIVE",
          invitedBy: user.id,
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return c.json({ data: member });
    }
  )

  // Update member role
  .patch(
    "/:businessId/:memberId",
    zValidator("param", z.object({ 
      businessId: z.string(),
      memberId: z.string(),
    })),
    zValidator(
      "json",
      z.object({
        role: z.enum(["ADMIN", "ACCOUNTANT", "VIEWER"]),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { businessId, memberId } = c.req.valid("param");
      const { role } = c.req.valid("json");

      // Check if user has permission to manage members
      const userRole = await getUserBusinessRole(user.id, businessId);
      if (!userRole || !hasPermission(userRole, "MANAGE_MEMBERS")) {
        return c.json({ error: "Forbidden" }, 403);
      }

      // Update member
      const member = await db.businessMember.update({
        where: {
          id: memberId,
          businessId,
        },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return c.json({ data: member });
    }
  )

  // Remove a member from a business
  .delete(
    "/:businessId/:memberId",
    zValidator("param", z.object({ 
      businessId: z.string(),
      memberId: z.string(),
    })),
    async (c) => {
      const user = await currentUser();
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { businessId, memberId } = c.req.valid("param");

      // Check if user has permission to manage members
      const userRole = await getUserBusinessRole(user.id, businessId);
      if (!userRole || !hasPermission(userRole, "MANAGE_MEMBERS")) {
        return c.json({ error: "Forbidden" }, 403);
      }

      // Delete member
      await db.businessMember.delete({
        where: {
          id: memberId,
          businessId,
        },
      });

      return c.json({ success: true });
    }
  );

export default app;
