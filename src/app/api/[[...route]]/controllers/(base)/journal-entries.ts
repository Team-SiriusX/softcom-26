import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";

const app = new Hono()
  // Get all journal entries with filters
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        ledgerAccountId: z.string().optional(),
        transactionId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.string().transform(Number).default("1"),
        limit: z.string().transform(Number).default("50"),
      })
    ),
    async (c) => {
      const {
        businessId,
        ledgerAccountId,
        transactionId,
        startDate,
        endDate,
        page,
        limit,
      } = c.req.valid("query");

      const skip = (page - 1) * limit;

      const where: any = { businessId };
      if (ledgerAccountId) where.ledgerAccountId = ledgerAccountId;
      if (transactionId) where.transactionId = transactionId;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const [entries, total] = await Promise.all([
        db.journalEntry.findMany({
          where,
          include: {
            ledgerAccount: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
                normalBalance: true,
              },
            },
            transaction: {
              select: {
                id: true,
                description: true,
                type: true,
              },
            },
          },
          orderBy: [{ date: "desc" }, { entryNumber: "desc" }],
          skip,
          take: limit,
        }),
        db.journalEntry.count({ where }),
      ]);

      return c.json({
        data: entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  )

  // Get general ledger for an account (running balance)
  .get(
    "/general-ledger",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        ledgerAccountId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    ),
    async (c) => {
      const { businessId, ledgerAccountId, startDate, endDate } =
        c.req.valid("query");

      const where: any = {
        businessId,
        ledgerAccountId,
      };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const account = await db.ledgerAccount.findUnique({
        where: { id: ledgerAccountId },
      });

      if (!account) {
        return c.json({ error: "Account not found" }, 404);
      }

      const entries = await db.journalEntry.findMany({
        where,
        include: {
          transaction: {
            select: {
              id: true,
              description: true,
              referenceNumber: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { entryNumber: "asc" }],
      });

      // Calculate running balance
      let runningBalance = 0;
      const ledgerWithBalance = entries.map((entry) => {
        const change =
          account.normalBalance === "DEBIT"
            ? Number(entry.debitAmount) - Number(entry.creditAmount)
            : Number(entry.creditAmount) - Number(entry.debitAmount);

        runningBalance += change;

        return {
          ...entry,
          balance: runningBalance,
        };
      });

      return c.json({
        account: {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          normalBalance: account.normalBalance,
        },
        entries: ledgerWithBalance,
        summary: {
          totalDebits: entries.reduce(
            (sum, e) => sum + Number(e.debitAmount),
            0
          ),
          totalCredits: entries.reduce(
            (sum, e) => sum + Number(e.creditAmount),
            0
          ),
          endingBalance: runningBalance,
        },
      });
    }
  )

  // Get trial balance
  .get(
    "/trial-balance",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        date: z.string().transform((val) => new Date(val)),
      })
    ),
    async (c) => {
      const { businessId, date } = c.req.valid("query");

      const accounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          isActive: true,
        },
        include: {
          journalEntries: {
            where: {
              date: {
                lte: date,
              },
            },
          },
        },
        orderBy: { code: "asc" },
      });

      const trialBalance = accounts.map((account) => {
        const totalDebits = account.journalEntries.reduce(
          (sum, entry) => sum + Number(entry.debitAmount),
          0
        );
        const totalCredits = account.journalEntries.reduce(
          (sum, entry) => sum + Number(entry.creditAmount),
          0
        );

        const balance =
          account.normalBalance === "DEBIT"
            ? totalDebits - totalCredits
            : totalCredits - totalDebits;

        return {
          code: account.code,
          name: account.name,
          type: account.type,
          normalBalance: account.normalBalance,
          debitBalance: account.normalBalance === "DEBIT" ? balance : 0,
          creditBalance: account.normalBalance === "CREDIT" ? balance : 0,
        };
      });

      const totalDebits = trialBalance.reduce(
        (sum, acc) => sum + acc.debitBalance,
        0
      );
      const totalCredits = trialBalance.reduce(
        (sum, acc) => sum + acc.creditBalance,
        0
      );

      return c.json({
        date,
        accounts: trialBalance,
        summary: {
          totalDebits,
          totalCredits,
          difference: totalDebits - totalCredits,
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
        },
      });
    }
  );

export default app;
