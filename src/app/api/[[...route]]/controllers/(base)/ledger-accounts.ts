import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";
import { AccountType, AccountSubType, BalanceType } from "@/generated/prisma";

const app = new Hono()
  // Get all ledger accounts for a business
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        type: z.nativeEnum(AccountType).optional(),
        isActive: z.string().transform((val) => val === "true").optional(),
      })
    ),
    async (c) => {
      const { businessId, type, isActive } = c.req.valid("query");

      const accounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          ...(type && { type }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          parentAccount: {
            select: { id: true, name: true, code: true },
          },
          subAccounts: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: {
              transactions: true,
              journalEntries: true,
            },
          },
        },
        orderBy: { code: "asc" },
      });

      return c.json({ data: accounts });
    }
  )

  // Get single ledger account with balance history
  .get("/:id", async (c) => {
    const id = c.req.param("id");

    const account = await db.ledgerAccount.findUnique({
      where: { id },
      include: {
        parentAccount: true,
        subAccounts: true,
        transactions: {
          take: 10,
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            type: true,
          },
        },
      },
    });

    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }

    return c.json({ data: account });
  })

  // Create ledger account
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.nativeEnum(AccountType),
        subType: z.nativeEnum(AccountSubType),
        normalBalance: z.nativeEnum(BalanceType),
        parentAccountId: z.string().optional(),
      })
    ),
    async (c) => {
      const data = c.req.valid("json");

      // Check if account code already exists for this business
      const existing = await db.ledgerAccount.findUnique({
        where: {
          businessId_code: {
            businessId: data.businessId,
            code: data.code,
          },
        },
      });

      if (existing) {
        return c.json({ error: "Account code already exists" }, 400);
      }

      const account = await db.ledgerAccount.create({
        data,
      });

      return c.json({ data: account }, 201);
    }
  )

  // Update ledger account
  .patch(
    "/:id",
    zValidator(
      "json",
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        parentAccountId: z.string().nullable().optional(),
      })
    ),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const account = await db.ledgerAccount.update({
        where: { id },
        data,
      });

      return c.json({ data: account });
    }
  )

  // Delete ledger account (only if no transactions)
  .delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Check if account has transactions
    const account = await db.ledgerAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            journalEntries: true,
          },
        },
      },
    });

    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }

    if (
      account._count.transactions > 0 ||
      account._count.journalEntries > 0
    ) {
      return c.json(
        {
          error:
            "Cannot delete account with transactions. Deactivate it instead.",
        },
        400
      );
    }

    await db.ledgerAccount.delete({
      where: { id },
    });

    return c.json({ message: "Account deleted successfully" });
  })

  // Bulk create default chart of accounts
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

      const defaultAccounts = [
        // Assets
        {
          code: "1000",
          name: "Cash",
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "1100",
          name: "Bank Account",
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "1200",
          name: "Accounts Receivable",
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "1300",
          name: "Inventory",
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "1500",
          name: "Equipment",
          type: AccountType.ASSET,
          subType: AccountSubType.FIXED_ASSET,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "1600",
          name: "Property",
          type: AccountType.ASSET,
          subType: AccountSubType.FIXED_ASSET,
          normalBalance: BalanceType.DEBIT,
        },

        // Liabilities
        {
          code: "2000",
          name: "Accounts Payable",
          type: AccountType.LIABILITY,
          subType: AccountSubType.CURRENT_LIABILITY,
          normalBalance: BalanceType.CREDIT,
        },
        {
          code: "2100",
          name: "Credit Card",
          type: AccountType.LIABILITY,
          subType: AccountSubType.CURRENT_LIABILITY,
          normalBalance: BalanceType.CREDIT,
        },
        {
          code: "2200",
          name: "Sales Tax Payable",
          type: AccountType.LIABILITY,
          subType: AccountSubType.CURRENT_LIABILITY,
          normalBalance: BalanceType.CREDIT,
        },
        {
          code: "2500",
          name: "Long-term Loan",
          type: AccountType.LIABILITY,
          subType: AccountSubType.LONG_TERM_LIABILITY,
          normalBalance: BalanceType.CREDIT,
        },

        // Equity
        {
          code: "3000",
          name: "Owner's Equity",
          type: AccountType.EQUITY,
          subType: AccountSubType.OWNERS_EQUITY,
          normalBalance: BalanceType.CREDIT,
        },
        {
          code: "3100",
          name: "Retained Earnings",
          type: AccountType.EQUITY,
          subType: AccountSubType.RETAINED_EARNINGS,
          normalBalance: BalanceType.CREDIT,
        },

        // Revenue
        {
          code: "4000",
          name: "Sales Revenue",
          type: AccountType.REVENUE,
          subType: AccountSubType.OPERATING_REVENUE,
          normalBalance: BalanceType.CREDIT,
        },
        {
          code: "4100",
          name: "Service Revenue",
          type: AccountType.REVENUE,
          subType: AccountSubType.OPERATING_REVENUE,
          normalBalance: BalanceType.CREDIT,
        },
        {
          code: "4900",
          name: "Other Income",
          type: AccountType.REVENUE,
          subType: AccountSubType.OTHER_REVENUE,
          normalBalance: BalanceType.CREDIT,
        },

        // Expenses
        {
          code: "5000",
          name: "Cost of Goods Sold",
          type: AccountType.EXPENSE,
          subType: AccountSubType.COST_OF_GOODS_SOLD,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "5100",
          name: "Rent Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "5200",
          name: "Salaries Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "5300",
          name: "Utilities Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "5400",
          name: "Marketing Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
        },
        {
          code: "5500",
          name: "Office Supplies",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
        },
      ];

      const accounts = await db.ledgerAccount.createMany({
        data: defaultAccounts.map((acc) => ({
          ...acc,
          businessId,
        })),
        skipDuplicates: true,
      });

      return c.json({
        message: "Default chart of accounts created",
        count: accounts.count,
      });
    }
  );

export default app;
