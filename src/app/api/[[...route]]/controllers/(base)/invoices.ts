import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/current-user";

const app = new Hono()
  // Get all invoices for a business
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        status: z.string().optional(),
        clientId: z.string().optional(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const { businessId, status, clientId } = c.req.valid("query");

      // Verify user owns this business
      const business = await db.business.findFirst({
        where: { id: businessId, userId: user.id },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      const invoices = await db.invoice.findMany({
        where: {
          businessId,
          ...(status ? { status: status as any } : {}),
          ...(clientId ? { clientId } : {}),
        },
        include: {
          client: true,
          items: true,
        },
        orderBy: { issueDate: "desc" },
      });

      return c.json({ data: invoices });
    }
  )

  // Get single invoice
  .get("/:id", async (c) => {
    const user = await currentUser();
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");

    const invoice = await db.invoice.findFirst({
      where: {
        id,
        business: { userId: user.id },
      },
      include: {
        client: true,
        items: true,
        business: true,
      },
    });

    if (!invoice) {
      return c.json({ error: "Invoice not found" }, 404);
    }

    return c.json({ data: invoice });
  })

  // Create invoice
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
        clientId: z.string(),
        invoiceNumber: z.string().min(1),
        issueDate: z.string(),
        dueDate: z.string(),
        status: z.enum(["DRAFT", "SENT", "VIEWED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
        subtotal: z.number(),
        taxAmount: z.number().default(0),
        discount: z.number().default(0),
        total: z.number(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        reminderDate: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            amount: z.number(),
          })
        ),
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

      // Check for duplicate invoice number
      const existingInvoice = await db.invoice.findFirst({
        where: {
          businessId: data.businessId,
          invoiceNumber: data.invoiceNumber,
        },
      });

      if (existingInvoice) {
        return c.json({ error: "Invoice number already exists" }, 400);
      }

      const { items, ...invoiceData } = data;

      const invoice = await db.invoice.create({
        data: {
          ...invoiceData,
          issueDate: new Date(invoiceData.issueDate),
          dueDate: new Date(invoiceData.dueDate),
          reminderDate: invoiceData.reminderDate
            ? new Date(invoiceData.reminderDate)
            : null,
          items: {
            create: items,
          },
        },
        include: {
          client: true,
          items: true,
        },
      });

      return c.json({ data: invoice }, 201);
    }
  )

  // Update invoice
  .patch(
    "/:id",
    zValidator(
      "json",
      z.object({
        invoiceNumber: z.string().optional(),
        issueDate: z.string().optional(),
        dueDate: z.string().optional(),
        status: z.enum(["DRAFT", "SENT", "VIEWED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
        subtotal: z.number().optional(),
        taxAmount: z.number().optional(),
        discount: z.number().optional(),
        total: z.number().optional(),
        paidAmount: z.number().optional(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        attachmentUrl: z.string().optional(),
        reminderSent: z.boolean().optional(),
        reminderDate: z.string().optional(),
        items: z.array(
          z.object({
            id: z.string().optional(),
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            amount: z.number(),
          })
        ).optional(),
      })
    ),
    async (c) => {
      const user = await currentUser();
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const id = c.req.param("id");
      const data = c.req.valid("json");

      // Verify user owns this invoice
      const existingInvoice = await db.invoice.findFirst({
        where: {
          id,
          business: { userId: user.id },
        },
        include: { items: true },
      });

      if (!existingInvoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }

      const { items, ...invoiceData } = data;

      // Prepare update data
      const updateData: any = {
        ...invoiceData,
        ...(invoiceData.issueDate && { issueDate: new Date(invoiceData.issueDate) }),
        ...(invoiceData.dueDate && { dueDate: new Date(invoiceData.dueDate) }),
        ...(invoiceData.reminderDate && { reminderDate: new Date(invoiceData.reminderDate) }),
      };

      // Handle items update if provided
      if (items) {
        // Delete existing items
        await db.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        // Create new items
        updateData.items = {
          create: items.map(({ id: _id, ...item }) => item),
        };
      }

      const invoice = await db.invoice.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          items: true,
        },
      });

      return c.json({ data: invoice });
    }
  )

  // Delete invoice
  .delete("/:id", async (c) => {
    const user = await currentUser();
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");

    // Verify user owns this invoice
    const existingInvoice = await db.invoice.findFirst({
      where: {
        id,
        business: { userId: user.id },
      },
    });

    if (!existingInvoice) {
      return c.json({ error: "Invoice not found" }, 404);
    }

    await db.invoice.delete({
      where: { id },
    });

    return c.json({ success: true });
  })

  // Get invoice statistics
  .get(
    "/stats/:businessId",
    async (c) => {
      const user = await currentUser();
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const businessId = c.req.param("businessId");

      // Verify user owns this business
      const business = await db.business.findFirst({
        where: { id: businessId, userId: user.id },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      const [totalInvoices, draftInvoices, sentInvoices, paidInvoices, overdueInvoices] = await Promise.all([
        db.invoice.count({ where: { businessId } }),
        db.invoice.count({ where: { businessId, status: "DRAFT" } }),
        db.invoice.count({ where: { businessId, status: "SENT" } }),
        db.invoice.count({ where: { businessId, status: "PAID" } }),
        db.invoice.count({ where: { businessId, status: "OVERDUE" } }),
      ]);

      const totalAmount = await db.invoice.aggregate({
        where: { businessId },
        _sum: { total: true },
      });

      const paidAmount = await db.invoice.aggregate({
        where: { businessId, status: "PAID" },
        _sum: { paidAmount: true },
      });

      const overdueAmount = await db.invoice.aggregate({
        where: { businessId, status: "OVERDUE" },
        _sum: { total: true },
      });

      return c.json({
        data: {
          totalInvoices,
          draftInvoices,
          sentInvoices,
          paidInvoices,
          overdueInvoices,
          totalAmount: totalAmount._sum.total || 0,
          paidAmount: paidAmount._sum.paidAmount || 0,
          overdueAmount: overdueAmount._sum.total || 0,
        },
      });
    }
  );

export default app;
