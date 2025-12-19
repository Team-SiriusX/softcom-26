import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";
import { AccountType, TransactionType } from "@/generated/prisma";

const app = new Hono()
  // Get dashboard overview metrics
  .get(
    "/overview",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        date: z.string().transform((val) => new Date(val)).optional(),
      })
    ),
    async (c) => {
      const { businessId, date } = c.req.valid("query");
      const endDate = date || new Date();
      const startDate = new Date(endDate);
      startDate.setDate(1); // First day of current month

      // Get current cash position
      const cashAccounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          OR: [
            { name: { contains: "Cash", mode: "insensitive" } },
            { name: { contains: "Bank", mode: "insensitive" } },
          ],
        },
        include: {
          journalEntries: {
            where: { date: { lte: endDate } },
          },
        },
      });

      const totalCash = cashAccounts.reduce((sum, account) => {
        const accountBalance = account.journalEntries.reduce((bal, entry) => {
          const change =
            account.normalBalance === "DEBIT"
              ? Number(entry.debitAmount) - Number(entry.creditAmount)
              : Number(entry.creditAmount) - Number(entry.debitAmount);
          return bal + change;
        }, 0);
        return sum + accountBalance;
      }, 0);

      // Get total revenue for current month
      const revenueAccounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.REVENUE,
        },
        include: {
          journalEntries: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      const monthlyRevenue = revenueAccounts.reduce((sum, account) => {
        const accountRevenue = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.creditAmount) - Number(entry.debitAmount));
        }, 0);
        return sum + accountRevenue;
      }, 0);

      // Get total expenses for current month
      const expenseAccounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.EXPENSE,
        },
        include: {
          journalEntries: {
            where: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      const monthlyExpenses = expenseAccounts.reduce((sum, account) => {
        const accountExpense = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.debitAmount) - Number(entry.creditAmount));
        }, 0);
        return sum + accountExpense;
      }, 0);

      // Calculate working capital
      const currentAssets = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.ASSET,
          subType: "CURRENT_ASSET",
        },
        include: {
          journalEntries: {
            where: { date: { lte: endDate } },
          },
        },
      });

      const totalCurrentAssets = currentAssets.reduce((sum, account) => {
        const balance = account.journalEntries.reduce((bal, entry) => {
          return (
            bal + (Number(entry.debitAmount) - Number(entry.creditAmount))
          );
        }, 0);
        return sum + balance;
      }, 0);

      const currentLiabilities = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.LIABILITY,
          subType: "CURRENT_LIABILITY",
        },
        include: {
          journalEntries: {
            where: { date: { lte: endDate } },
          },
        },
      });

      const totalCurrentLiabilities = currentLiabilities.reduce(
        (sum, account) => {
          const balance = account.journalEntries.reduce((bal, entry) => {
            return (
              bal + (Number(entry.creditAmount) - Number(entry.debitAmount))
            );
          }, 0);
          return sum + balance;
        },
        0
      );

      const workingCapital = totalCurrentAssets - totalCurrentLiabilities;

      // Get transaction count
      const transactionCount = await db.transaction.count({
        where: {
          businessId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Calculate burn rate (average monthly expenses for last 3 months)
      const threeMonthsAgo = new Date(endDate);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const burnRateExpenses = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.EXPENSE,
        },
        include: {
          journalEntries: {
            where: {
              date: {
                gte: threeMonthsAgo,
                lte: endDate,
              },
            },
          },
        },
      });

      const totalBurnRateExpenses = burnRateExpenses.reduce((sum, account) => {
        const accountExpense = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.debitAmount) - Number(entry.creditAmount));
        }, 0);
        return sum + accountExpense;
      }, 0);

      const burnRate = totalBurnRateExpenses / 3; // Average per month

      return c.json({
        cash: {
          current: totalCash,
          change: 0, // TODO: Calculate vs previous period
        },
        revenue: {
          monthly: monthlyRevenue,
          change: 0, // TODO: Calculate vs previous month
        },
        expenses: {
          monthly: monthlyExpenses,
          change: 0, // TODO: Calculate vs previous month
        },
        netIncome: {
          monthly: monthlyRevenue - monthlyExpenses,
          margin:
            monthlyRevenue > 0
              ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100
              : 0,
        },
        workingCapital: {
          amount: workingCapital,
          currentRatio:
            totalCurrentLiabilities > 0
              ? totalCurrentAssets / totalCurrentLiabilities
              : 0,
        },
        burnRate: {
          monthly: burnRate,
          runway: burnRate > 0 ? totalCash / burnRate : 0, // Months until cash runs out
        },
        transactionCount,
      });
    }
  )

  // Get revenue trends (monthly for last 12 months)
  .get(
    "/revenue-trends",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        months: z.string().transform(Number).default("12"),
      })
    ),
    async (c) => {
      const { businessId, months } = c.req.valid("query");

      const trends = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(currentDate);
        monthDate.setMonth(monthDate.getMonth() - i);
        const startDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          1
        );
        const endDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0
        );

        const transactions = await db.transaction.findMany({
          where: {
            businessId,
            type: TransactionType.INCOME,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const revenue = transactions.reduce(
          (sum, t) => sum + Number(t.amount),
          0
        );

        trends.push({
          month: startDate.toISOString().substring(0, 7),
          revenue,
          count: transactions.length,
        });
      }

      return c.json({ data: trends });
    }
  )

  // Get expense breakdown by category
  .get(
    "/expense-breakdown",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        startDate: z.string().transform((val) => new Date(val)),
        endDate: z.string().transform((val) => new Date(val)),
      })
    ),
    async (c) => {
      const { businessId, startDate, endDate } = c.req.valid("query");

      const expenses = await db.transaction.findMany({
        where: {
          businessId,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
        },
      });

      // Group by category
      const breakdown = expenses.reduce((acc: any, transaction) => {
        const categoryName = transaction.category?.name || "Uncategorized";
        const categoryColor = transaction.category?.color || "#94a3b8";
        const categoryIcon = transaction.category?.icon || "📊";

        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            color: categoryColor,
            icon: categoryIcon,
            total: 0,
            count: 0,
            transactions: [],
          };
        }

        acc[categoryName].total += Number(transaction.amount);
        acc[categoryName].count += 1;
        acc[categoryName].transactions.push({
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          amount: Number(transaction.amount),
        });

        return acc;
      }, {});

      const categories = Object.values(breakdown).sort(
        (a: any, b: any) => b.total - a.total
      );

      const totalExpenses = categories.reduce(
        (sum: number, cat: any) => sum + cat.total,
        0
      );

      return c.json({
        categories,
        total: totalExpenses,
      });
    }
  )

  // Get top expense categories
  .get(
    "/top-expenses",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        startDate: z.string().transform((val) => new Date(val)),
        endDate: z.string().transform((val) => new Date(val)),
        limit: z.string().transform(Number).default("5"),
      })
    ),
    async (c) => {
      const { businessId, startDate, endDate, limit } = c.req.valid("query");

      const expenses = await db.transaction.findMany({
        where: {
          businessId,
          type: TransactionType.EXPENSE,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
        },
      });

      const categoryTotals = expenses.reduce((acc: any, transaction) => {
        const categoryName = transaction.category?.name || "Uncategorized";
        acc[categoryName] =
          (acc[categoryName] || 0) + Number(transaction.amount);
        return acc;
      }, {});

      const topExpenses = Object.entries(categoryTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a: any, b: any) => b.total - a.total)
        .slice(0, limit);

      return c.json({ data: topExpenses });
    }
  )

  // Get account balance history
  .get(
    "/account-balance-history",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        ledgerAccountId: z.string(),
        startDate: z.string().transform((val) => new Date(val)),
        endDate: z.string().transform((val) => new Date(val)),
        interval: z.enum(["daily", "weekly", "monthly"]).default("daily"),
      })
    ),
    async (c) => {
      const { businessId, ledgerAccountId, startDate, endDate, interval } =
        c.req.valid("query");

      const account = await db.ledgerAccount.findUnique({
        where: { id: ledgerAccountId },
      });

      if (!account) {
        return c.json({ error: "Account not found" }, 404);
      }

      const entries = await db.journalEntry.findMany({
        where: {
          businessId,
          ledgerAccountId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      });

      // Calculate running balance by interval
      const history: any[] = [];
      let runningBalance = 0;

      entries.forEach((entry) => {
        const change =
          account.normalBalance === "DEBIT"
            ? Number(entry.debitAmount) - Number(entry.creditAmount)
            : Number(entry.creditAmount) - Number(entry.debitAmount);

        runningBalance += change;

        history.push({
          date: entry.date,
          balance: runningBalance,
          debit: Number(entry.debitAmount),
          credit: Number(entry.creditAmount),
        });
      });

      return c.json({
        account: {
          id: account.id,
          name: account.name,
          code: account.code,
        },
        history,
      });
    }
  );

export default app;
