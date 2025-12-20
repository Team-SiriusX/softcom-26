import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";
import { TransactionType, BalanceType, EntryType } from "@/generated/prisma";
import { TIER_LIMITS } from "@/lib/subscription-utils";

// Helper function to check transaction limit for a business
async function checkTransactionLimit(businessId: string): Promise<{ allowed: boolean; error?: string; tier?: string }> {
  // Get the business and its owner's subscription
  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      user: {
        select: { subscriptionTier: true },
      },
    },
  });

  if (!business) {
    return { allowed: false, error: "Business not found" };
  }

  const tier = business.user.subscriptionTier || "FREE";
  const tierLimits = TIER_LIMITS[tier];

  // If unlimited transactions, allow
  if (tierLimits.transactionsLimit === -1) {
    return { allowed: true, tier };
  }

  // Count transactions for this month across ALL user's businesses
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyTransactionCount = await db.transaction.count({
    where: {
      business: {
        userId: business.userId,
      },
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  if (monthlyTransactionCount >= tierLimits.transactionsLimit) {
    const upgradeMessage = tier === "FREE"
      ? "Upgrade to Pro or Business for unlimited transactions."
      : "";
    return {
      allowed: false,
      error: `You have reached your monthly limit of ${tierLimits.transactionsLimit} transactions. ${upgradeMessage}`,
      tier,
    };
  }

  return { allowed: true, tier };
}

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
        page: z.string().optional().transform((val) => Number(val || 1)),
        limit: z.string().optional().transform((val) => Number(val || 50)),
        sortBy: z.enum(["date", "amount", "description", "createdAt"]).optional().default("date"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
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
        sortBy,
        sortOrder,
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
          orderBy: { [sortBy]: sortOrder },
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

      // Check transaction limit
      const limitCheck = await checkTransactionLimit(data.businessId);
      if (!limitCheck.allowed) {
        return c.json({ error: limitCheck.error }, 403);
      }

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

      // Create transaction and journal entries in a transaction
      const result = await db.$transaction(async (tx) => {
        // Generate entry number (sequential) - inside transaction to avoid race conditions
        const lastEntry = await tx.journalEntry.findFirst({
          where: { businessId: data.businessId },
          orderBy: { entryNumber: "desc" },
        });

        const nextEntryNumber = lastEntry
          ? (parseInt(lastEntry.entryNumber) + 1).toString().padStart(6, "0")
          : "000001";

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
          const creditAmount = typeof entry.creditAmount === 'number' ? entry.creditAmount : Number(entry.creditAmount);
          const debitAmount = typeof entry.debitAmount === 'number' ? entry.debitAmount : Number(entry.debitAmount);
          const balanceChange =
            account.normalBalance === BalanceType.DEBIT
              ? creditAmount - debitAmount
              : debitAmount - creditAmount;

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
  })

  // Bulk import transactions
  .post(
    "/bulk-import",
    zValidator(
      "json",
      z.object({
        businessId: z.string(),
        transactions: z.array(
          z.object({
            date: z.string().transform((val) => new Date(val)),
            description: z.string().min(1),
            amount: z.number().positive(),
            type: z.nativeEnum(TransactionType),
            ledgerAccountId: z.string().optional(),
            contraAccountId: z.string().optional(),
            categoryId: z.string().optional(),
            referenceNumber: z.string().optional(),
            notes: z.string().optional(),
          })
        ),
      })
    ),
    async (c) => {
      const { businessId, transactions } = c.req.valid("json");

      // Check if user can import CSV (subscription feature check)
      const business = await db.business.findUnique({
        where: { id: businessId },
        include: {
          user: {
            select: { subscriptionTier: true },
          },
        },
      });

      if (!business) {
        return c.json({ error: "Business not found" }, 404);
      }

      const tier = business.user.subscriptionTier || "FREE";
      const canImport = TIER_LIMITS[tier].features.csvImport;

      if (!canImport) {
        return c.json({ 
          error: "CSV import is not available on the Free plan. Upgrade to Pro or Business to import transactions from CSV files." 
        }, 403);
      }

      // Pre-fetch all accounts for this business (cached lookup)
      const allAccounts = await db.ledgerAccount.findMany({
        where: { businessId },
      });

      const accountsMap = new Map(allAccounts.map((a) => [a.id, a]));
      const cashAccount = allAccounts.find((a) => a.code === "1000");
      const revenueAccount = allAccounts.find((a) => a.code === "4000");
      const expenseAccount = allAccounts.find((a) => a.code === "5000");

      // Get last entry number once
      const lastEntry = await db.journalEntry.findFirst({
        where: { businessId },
        orderBy: { entryNumber: "desc" },
      });
      let currentEntryNumber = lastEntry
        ? parseInt(lastEntry.entryNumber)
        : 0;

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Prepare all valid transactions first (validation pass)
      const validTransactions: {
        data: (typeof transactions)[0];
        mainAccountId: string;
        contraAccountId: string;
        mainAccount: (typeof allAccounts)[0];
        contraAccount: (typeof allAccounts)[0];
        entryNumber: string;
      }[] = [];

      for (let i = 0; i < transactions.length; i++) {
        const data = transactions[i];

        try {
          // Determine accounts
          let mainAccountId = data.ledgerAccountId || cashAccount?.id;
          let contraAccountId = data.contraAccountId;

          if (!mainAccountId) {
            results.errors.push(
              `Row ${i + 1}: No main account specified and no default cash account found`
            );
            results.failed++;
            continue;
          }

          // Auto-assign contra account based on type if not specified
          if (!contraAccountId) {
            if (data.type === TransactionType.INCOME) {
              contraAccountId = revenueAccount?.id;
            } else if (data.type === TransactionType.EXPENSE) {
              contraAccountId = expenseAccount?.id;
            }
          }

          if (!contraAccountId) {
            results.errors.push(
              `Row ${i + 1}: No contra account specified and no default account found for type ${data.type}`
            );
            results.failed++;
            continue;
          }

          // Lookup accounts from cache
          const mainAccount = accountsMap.get(mainAccountId);
          const contraAccount = accountsMap.get(contraAccountId);

          if (!mainAccount || !contraAccount) {
            results.errors.push(`Row ${i + 1}: Invalid account ID`);
            results.failed++;
            continue;
          }

          currentEntryNumber++;
          const entryNumber = currentEntryNumber.toString().padStart(6, "0");

          validTransactions.push({
            data,
            mainAccountId,
            contraAccountId,
            mainAccount,
            contraAccount,
            entryNumber,
          });
        } catch (error) {
          results.errors.push(
            `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          results.failed++;
        }
      }

      // Track balance changes to apply at the end
      const balanceChanges = new Map<string, number>();

      // Process in batches with extended timeout
      const BATCH_SIZE = 50;
      for (let batch = 0; batch < validTransactions.length; batch += BATCH_SIZE) {
        const batchItems = validTransactions.slice(batch, batch + BATCH_SIZE);

        await db.$transaction(
          async (tx) => {
            for (const item of batchItems) {
              const { data, mainAccountId, contraAccountId, mainAccount, contraAccount, entryNumber } = item;

              // Create transaction
              const transaction = await tx.transaction.create({
                data: {
                  businessId,
                  date: data.date,
                  description: data.description,
                  amount: data.amount,
                  type: data.type,
                  ledgerAccountId: mainAccountId,
                  categoryId: data.categoryId,
                  referenceNumber: data.referenceNumber,
                  notes: data.notes,
                },
              });

              // Create journal entries
              let journalEntries: any[] = [];

              if (data.type === TransactionType.INCOME) {
                journalEntries = [
                  {
                    businessId,
                    transactionId: transaction.id,
                    ledgerAccountId: mainAccountId,
                    date: data.date,
                    entryNumber,
                    description: data.description,
                    debitAmount: data.amount,
                    creditAmount: 0,
                    entryType: EntryType.STANDARD,
                  },
                  {
                    businessId,
                    transactionId: transaction.id,
                    ledgerAccountId: contraAccountId,
                    date: data.date,
                    entryNumber,
                    description: data.description,
                    debitAmount: 0,
                    creditAmount: data.amount,
                    entryType: EntryType.STANDARD,
                  },
                ];
              } else if (data.type === TransactionType.EXPENSE) {
                journalEntries = [
                  {
                    businessId,
                    transactionId: transaction.id,
                    ledgerAccountId: contraAccountId,
                    date: data.date,
                    entryNumber,
                    description: data.description,
                    debitAmount: data.amount,
                    creditAmount: 0,
                    entryType: EntryType.STANDARD,
                  },
                  {
                    businessId,
                    transactionId: transaction.id,
                    ledgerAccountId: mainAccountId,
                    date: data.date,
                    entryNumber,
                    description: data.description,
                    debitAmount: 0,
                    creditAmount: data.amount,
                    entryType: EntryType.STANDARD,
                  },
                ];
              } else {
                journalEntries = [
                  {
                    businessId,
                    transactionId: transaction.id,
                    ledgerAccountId: mainAccountId,
                    date: data.date,
                    entryNumber,
                    description: data.description,
                    debitAmount: data.amount,
                    creditAmount: 0,
                    entryType: EntryType.STANDARD,
                  },
                  {
                    businessId,
                    transactionId: transaction.id,
                    ledgerAccountId: contraAccountId,
                    date: data.date,
                    entryNumber,
                    description: data.description,
                    debitAmount: 0,
                    creditAmount: data.amount,
                    entryType: EntryType.STANDARD,
                  },
                ];
              }

              await tx.journalEntry.createMany({ data: journalEntries });

              // Calculate balance changes (accumulate for batch update)
              for (const entry of journalEntries) {
                const account = accountsMap.get(entry.ledgerAccountId);
                if (!account) continue;

                const debitAmount = entry.debitAmount || 0;
                const creditAmount = entry.creditAmount || 0;

                const isDebitBalance = ["ASSET", "EXPENSE"].includes(account.type as string);
                const balanceChange = isDebitBalance
                  ? debitAmount - creditAmount
                  : creditAmount - debitAmount;

                const current = balanceChanges.get(entry.ledgerAccountId) || 0;
                balanceChanges.set(entry.ledgerAccountId, current + balanceChange);
              }

              results.success++;
            }

            // Apply balance changes for this batch
            for (const [accountId, change] of balanceChanges) {
              if (change !== 0) {
                await tx.ledgerAccount.update({
                  where: { id: accountId },
                  data: {
                    currentBalance: { increment: change },
                  },
                });
              }
            }
            balanceChanges.clear();
          },
          {
            timeout: 60000, // 60 second timeout per batch
          }
        );
      }

      return c.json({
        data: results,
        message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
      });
    }
  );

export default app;
