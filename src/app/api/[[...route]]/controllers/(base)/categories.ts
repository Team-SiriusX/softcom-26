import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";
import { CategoryType } from "@/generated/prisma";

const app = new Hono()
  // Get all categories for a business
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        type: z.nativeEnum(CategoryType).optional(),
        isActive: z.string().transform((val) => val === "true").optional(),
      })
    ),
    async (c) => {
      const { businessId, type, isActive } = c.req.valid("query");

      const categories = await db.category.findMany({
        where: {
          businessId,
          ...(type && { type }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          parent: {
            select: { id: true, name: true },
          },
          children: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return c.json({ data: categories });
    }
  )

  // Get single category
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const category = await db.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        transactions: {
          take: 10,
          orderBy: { date: "desc" },
        },
      },
    });

    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }

    return c.json({ data: category });
  })

  // Create category
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.nativeEnum(CategoryType),
        color: z.string().optional(),
        icon: z.string().optional(),
        parentId: z.string().optional(),
      })
    ),
    async (c) => {
      const data = c.req.valid("json");

      // Check if category name already exists for this business
      const existing = await db.category.findUnique({
        where: {
          businessId_name: {
            businessId: data.businessId,
            name: data.name,
          },
        },
      });

      if (existing) {
        return c.json({ error: "Category name already exists" }, 400);
      }

      const category = await db.category.create({
        data,
      });

      return c.json({ data: category }, 201);
    }
  )

  // Update category
  .patch(
    "/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.nativeEnum(CategoryType).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
        parentId: z.string().nullable().optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const category = await db.category.update({
        where: { id },
        data,
      });

      return c.json({ data: category });
    }
  )

  // Delete category (only if no transactions)
  .delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Check if category has transactions
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }

    if (category._count.transactions > 0) {
      return c.json(
        {
          error:
            "Cannot delete category with transactions. Deactivate it instead.",
        },
        400
      );
    }

    if (category._count.children > 0) {
      return c.json(
        {
          error: "Cannot delete category with subcategories.",
        },
        400
      );
    }

    await db.category.delete({
      where: { id },
    });

    return c.json({ message: "Category deleted successfully" });
  })

  // Bulk create default categories
  .post(
    "/bulk-create-default",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
      })
    ),
    async (c) => {
      const { businessId } = c.req.valid("json");

      const defaultCategories = [
        // Income categories
        {
          name: "Product Sales",
          type: CategoryType.INCOME,
          color: "#10b981",
          icon: "📦",
        },
        {
          name: "Service Revenue",
          type: CategoryType.INCOME,
          color: "#10b981",
          icon: "💼",
        },
        {
          name: "Consulting",
          type: CategoryType.INCOME,
          color: "#10b981",
          icon: "🎯",
        },

        // Expense categories
        {
          name: "Rent & Lease",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "🏢",
        },
        {
          name: "Salaries & Wages",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "👥",
        },
        {
          name: "Marketing",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "📢",
        },
        {
          name: "Office Supplies",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "📎",
        },
        {
          name: "Utilities",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "⚡",
        },
        {
          name: "Travel",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "✈️",
        },
        {
          name: "Software & Subscriptions",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "💻",
        },
        {
          name: "Professional Services",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          icon: "⚖️",
        },

        // Transfer categories
        {
          name: "Owner Investment",
          type: CategoryType.TRANSFER,
          color: "#3b82f6",
          icon: "💰",
        },
        {
          name: "Owner Withdrawal",
          type: CategoryType.TRANSFER,
          color: "#3b82f6",
          icon: "💸",
        },
        {
          name: "Loan Payment",
          type: CategoryType.TRANSFER,
          color: "#3b82f6",
          icon: "🏦",
        },
      ];

      const categories = await db.category.createMany({
        data: defaultCategories.map((cat) => ({
          ...cat,
          businessId,
        })),
        skipDuplicates: true,
      });

      return c.json({
        message: "Default categories created",
        count: categories.count,
      });
    }
  );

export default app;
