import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";
import { TransactionType, BalanceType, EntryType } from "@/generated/prisma";

const app = new Hono()
  // Get all transactions with filters
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        type: z.nativeEnum(TransactionType).optional(),
        ledgerAccountId: z.string().optional(),
        categoryId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        isReconciled: z.string().transform((val) => val === "true").optional(),
        page: z.string().transform(Number).default("1"),
        limit: z.string().transform(Number).default("50"),
      })
    ),
    async (c) => {
      const {
        businessId,
        type,
        ledgerAccountId,
        categoryId,
        startDate,
        endDate,
        isReconciled,
        page,
        limit,
      } = c.req.valid("query");

      const skip = (page - 1) * limit;

      const where: any = { businessId };
      if (type) where.type = type;
      if (ledgerAccountId) where.ledgerAccountId = ledgerAccountId;
      if (categoryId) where.categoryId = categoryId;
      if (isReconciled !== undefined) where.isReconciled = isReconciled;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const [transactions, total] = await Promise.all([
        db.transaction.findMany({
          where,
          include: {
            ledgerAccount: {
              select: { id: true, name: true, code: true },
            },
            category: {
              select: { id: true, name: true, color: true, icon: true },
            },
          },
          orderBy: { date: "desc" },
          skip,
          take: limit,
        }),
        db.transaction.count({ where }),
      ]);

      return c.json({
        data: transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  )

  // Get single transaction with journal entries
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        ledgerAccount: true,
        category: true,
        journalEntries: {
          include: {
            ledgerAccount: {
              select: { id: true, name: true, code: true, type: true },
            },
          },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!transaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    return c.json({ data: transaction });
  })

  // Create transaction with automatic journal entries
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
        date: z.string().transform((val) => new Date(val)),
        description: z.string().min(1),
        amount: z.number().positive(),
        type: z.nativeEnum(TransactionType),
        ledgerAccountId: z.string(),
        categoryId: z.string().optional(),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
        // For double-entry, specify the contra account
        contraAccountId: z.string(),
      })
    ),
    async (c) => {
      const data = c.req.valid("json");

      // Get both accounts to determine debits and credits
      const [mainAccount, contraAccount] = await Promise.all([
        db.ledgerAccount.findUnique({
          where: { id: data.ledgerAccountId },
        }),
        db.ledgerAccount.findUnique({
          where: { id: data.contraAccountId },
        }),
      ]);

      if (!mainAccount || !contraAccount) {
        return c.json({ error: "Invalid account ID" }, 400);
      }

      // Generate entry number (sequential)
      const lastEntry = await db.journalEntry.findFirst({
        where: { businessId: data.businessId },
        orderBy: { entryNumber: "desc" },
      });

      const nextEntryNumber = lastEntry
        ? (parseInt(lastEntry.entryNumber) + 1).toString().padStart(6, "0")
        : "000001";

      // Create transaction and journal entries in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            businessId: data.businessId,
            date: data.date,
            description: data.description,
            amount: data.amount,
            type: data.type,
            ledgerAccountId: data.ledgerAccountId,
            categoryId: data.categoryId,
            referenceNumber: data.referenceNumber,
            notes: data.notes,
          },
        });

        // Determine debit and credit based on transaction type
        let journalEntries: any[] = [];

        if (data.type === TransactionType.INCOME) {
          // Income: Debit Cash/Bank, Credit Revenue
          journalEntries = [
            {
              businessId: data.businessId,
              transactionId: transaction.id,
              ledgerAccountId: data.ledgerAccountId, // Cash/Bank
              date: data.date,
              entryNumber: nextEntryNumber,
              description: data.description,
              debitAmount: data.amount,
              creditAmount: 0,
              entryType: EntryType.STANDARD,
            },
            {
              businessId: data.businessId,
              transactionId: transaction.id,
              ledgerAccountId: data.contraAccountId, // Revenue account
              date: data.date,
              entryNumber: nextEntryNumber,
              description: data.description,
              debitAmount: 0,
              creditAmount: data.amount,
              entryType: EntryType.STANDARD,
            },
          ];
        } else if (data.type === TransactionType.EXPENSE) {
          // Expense: Debit Expense, Credit Cash/Bank
          journalEntries = [
            {
              businessId: data.businessId,
              transactionId: transaction.id,
              ledgerAccountId: data.contraAccountId, // Expense account
              date: data.date,
              entryNumber: nextEntryNumber,
              description: data.description,
              debitAmount: data.amount,
              creditAmount: 0,
              entryType: EntryType.STANDARD,
            },
            {
              businessId: data.businessId,
              transactionId: transaction.id,
              ledgerAccountId: data.ledgerAccountId, // Cash/Bank
              date: data.date,
              entryNumber: nextEntryNumber,
              description: data.description,
              debitAmount: 0,
              creditAmount: data.amount,
              entryType: EntryType.STANDARD,
            },
          ];
        } else {
          // Transfer: Debit To Account, Credit From Account
          journalEntries = [
            {
              businessId: data.businessId,
              transactionId: transaction.id,
              ledgerAccountId: data.ledgerAccountId, // To account
              date: data.date,
              entryNumber: nextEntryNumber,
              description: data.description,
              debitAmount: data.amount,
              creditAmount: 0,
              entryType: EntryType.STANDARD,
            },
            {
              businessId: data.businessId,
              transactionId: transaction.id,
              ledgerAccountId: data.contraAccountId, // From account
              date: data.date,
              entryNumber: nextEntryNumber,
              description: data.description,
              debitAmount: 0,
              creditAmount: data.amount,
              entryType: EntryType.STANDARD,
            },
          ];
        }

        // Create journal entries
        await tx.journalEntry.createMany({
          data: journalEntries,
        });

        // Update account balances
        for (const entry of journalEntries) {
          const account = await tx.ledgerAccount.findUnique({
            where: { id: entry.ledgerAccountId },
          });

          if (account) {
            const balanceChange =
              account.normalBalance === BalanceType.DEBIT
                ? entry.debitAmount - entry.creditAmount
                : entry.creditAmount - entry.debitAmount;

            await tx.ledgerAccount.update({
              where: { id: entry.ledgerAccountId },
              data: {
                currentBalance: {
                  increment: balanceChange,
                },
              },
            });
          }
        }

        return transaction;
      });

      return c.json({ data: result }, 201);
    }
  )

  // Update transaction
  .patch(
    "/:id",
    zValidator(
      "json",
      z.object({
        description: z.string().min(1).optional(),
        categoryId: z.string().nullable().optional(),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
        isReconciled: z.boolean().optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      // Only allow updating non-financial fields
      const transaction = await db.transaction.update({
        where: { id },
        data,
      });

      return c.json({ data: transaction });
    }
  )

  // Delete transaction (and reverse journal entries)
  .delete("/:id", async (c) => {
    const id = c.req.param("id");

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        journalEntries: true,
      },
    });

    if (!transaction) {
      return c.json({ error: "Transaction not found" }, 404);
    }

    if (transaction.isReconciled) {
      return c.json(
        { error: "Cannot delete reconciled transaction" },
        400
      );
    }

    await db.$transaction(async (tx) => {
      // Reverse account balances
      for (const entry of transaction.journalEntries) {
        const account = await tx.ledgerAccount.findUnique({
          where: { id: entry.ledgerAccountId },
        });

        if (account) {
          const balanceChange =
            account.normalBalance === BalanceType.DEBIT
              ? entry.creditAmount - entry.debitAmount
              : entry.debitAmount - entry.creditAmount;

          await tx.ledgerAccount.update({
            where: { id: entry.ledgerAccountId },
            data: {
              currentBalance: {
                increment: balanceChange,
              },
            },
          });
        }
      }

      // Delete journal entries
      await tx.journalEntry.deleteMany({
        where: { transactionId: id },
      });

      // Delete transaction
      await tx.transaction.delete({
        where: { id },
      });
    });

    return c.json({ message: "Transaction deleted successfully" });
  })

  // Reconcile transaction
  .post("/:id/reconcile", async (c) => {
    const id = c.req.param("id");

    const transaction = await db.transaction.update({
      where: { id },
      data: { isReconciled: true },
    });

    return c.json({ data: transaction });
  })

  // Unreconcile transaction
  .post("/:id/unreconcile", async (c) => {
    const id = c.req.param("id");

    const transaction = await db.transaction.update({
      where: { id },
      data: { isReconciled: false },
    });

    return c.json({ data: transaction });
  });

export default app;
