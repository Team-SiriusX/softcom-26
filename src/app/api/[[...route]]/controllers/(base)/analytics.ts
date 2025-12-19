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
        months: z.string().optional().transform((val) => Number(val || 12)),
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
        limit: z.string().optional().transform((val) => Number(val || 5)),
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
  )

  // Get balance sheet
  .get(
    "/balance-sheet",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        date: z.string().transform((val) => new Date(val)).optional(),
      })
    ),
    async (c) => {
      const { businessId, date } = c.req.valid("query");
      const asOfDate = date || new Date();

      // Get all asset accounts with their balances
      const assets = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.ASSET,
        },
        include: {
          journalEntries: {
            where: { date: { lte: asOfDate } },
          },
        },
      });

      const assetBalances = assets.map((account) => {
        const balance = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.debitAmount) - Number(entry.creditAmount));
        }, 0);

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          subType: account.subType,
          balance,
        };
      });

      const currentAssets = assetBalances.filter((a) =>
        a.subType?.includes("CURRENT")
      );
      const fixedAssets = assetBalances.filter(
        (a) => a.subType === "FIXED_ASSET"
      );
      const otherAssets = assetBalances.filter(
        (a) => !a.subType || (!a.subType.includes("CURRENT") && a.subType !== "FIXED_ASSET")
      );

      const totalCurrentAssets = currentAssets.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalFixedAssets = fixedAssets.reduce((sum, a) => sum + a.balance, 0);
      const totalOtherAssets = otherAssets.reduce((sum, a) => sum + a.balance, 0);
      const totalAssets = totalCurrentAssets + totalFixedAssets + totalOtherAssets;

      // Get all liability accounts with their balances
      const liabilities = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.LIABILITY,
        },
        include: {
          journalEntries: {
            where: { date: { lte: asOfDate } },
          },
        },
      });

      const liabilityBalances = liabilities.map((account) => {
        const balance = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.creditAmount) - Number(entry.debitAmount));
        }, 0);

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          subType: account.subType,
          balance,
        };
      });

      const currentLiabilities = liabilityBalances.filter((l) =>
        l.subType?.includes("CURRENT")
      );
      const longTermLiabilities = liabilityBalances.filter(
        (l) => l.subType === "LONG_TERM_LIABILITY"
      );

      const totalCurrentLiabilities = currentLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      const totalLongTermLiabilities = longTermLiabilities.reduce(
        (sum, l) => sum + l.balance,
        0
      );
      const totalLiabilities =
        totalCurrentLiabilities + totalLongTermLiabilities;

      // Get all equity accounts with their balances
      const equity = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.EQUITY,
        },
        include: {
          journalEntries: {
            where: { date: { lte: asOfDate } },
          },
        },
      });

      const equityBalances = equity.map((account) => {
        const balance = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.creditAmount) - Number(entry.debitAmount));
        }, 0);

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          balance,
        };
      });

      const totalEquity = equityBalances.reduce((sum, e) => sum + e.balance, 0);

      return c.json({
        asOfDate,
        assets: {
          current: {
            accounts: currentAssets,
            total: totalCurrentAssets,
          },
          fixed: {
            accounts: fixedAssets,
            total: totalFixedAssets,
          },
          other: {
            accounts: otherAssets,
            total: totalOtherAssets,
          },
          total: totalAssets,
        },
        liabilities: {
          current: {
            accounts: currentLiabilities,
            total: totalCurrentLiabilities,
          },
          longTerm: {
            accounts: longTermLiabilities,
            total: totalLongTermLiabilities,
          },
          total: totalLiabilities,
        },
        equity: {
          accounts: equityBalances,
          total: totalEquity,
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      });
    }
  )

  // Get Profit & Loss statement
  .get(
    "/profit-loss",
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

      // Get revenue accounts
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

      const revenueData = revenueAccounts.map((account) => {
        const balance = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.creditAmount) - Number(entry.debitAmount));
        }, 0);

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          amount: balance,
        };
      });

      const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0);

      // Get expense accounts
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

      const expenseData = expenseAccounts.map((account) => {
        const balance = account.journalEntries.reduce((bal, entry) => {
          return bal + (Number(entry.debitAmount) - Number(entry.creditAmount));
        }, 0);

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          amount: balance,
        };
      });

      const totalExpenses = expenseData.reduce((sum, e) => sum + e.amount, 0);
      const netIncome = totalRevenue - totalExpenses;

      return c.json({
        period: {
          startDate,
          endDate,
        },
        revenue: {
          accounts: revenueData,
          total: totalRevenue,
        },
        expenses: {
          accounts: expenseData,
          total: totalExpenses,
        },
        netIncome,
        netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
      });
    }
  )

  // Get Cash Flow statement
  .get(
    "/cash-flow",
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

      // Get cash and bank accounts
      const cashAccounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          OR: [
            { name: { contains: "Cash", mode: "insensitive" } },
            { name: { contains: "Bank", mode: "insensitive" } },
          ],
        },
      });

      const cashAccountIds = cashAccounts.map((a) => a.id);

      // Operating activities (from transactions)
      const operatingTransactions = await db.transaction.findMany({
        where: {
          businessId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          OR: [
            { type: TransactionType.INCOME },
            { type: TransactionType.EXPENSE },
          ],
        },
        include: {
          category: true,
        },
      });

      const operatingInflows = operatingTransactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const operatingOutflows = operatingTransactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const netOperatingCashFlow = operatingInflows - operatingOutflows;

      // Investment activities (fixed asset purchases/sales)
      const investmentEntries = await db.journalEntry.findMany({
        where: {
          businessId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          ledgerAccount: {
            type: AccountType.ASSET,
            subType: "FIXED_ASSET",
          },
        },
        include: {
          ledgerAccount: true,
        },
      });

      const investmentOutflows = investmentEntries.reduce((sum, entry) => {
        return sum + Number(entry.debitAmount);
      }, 0);

      const investmentInflows = investmentEntries.reduce((sum, entry) => {
        return sum + Number(entry.creditAmount);
      }, 0);

      const netInvestingCashFlow = investmentInflows - investmentOutflows;

      // Financing activities (loans, equity)
      const financingEntries = await db.journalEntry.findMany({
        where: {
          businessId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          OR: [
            {
              ledgerAccount: {
                type: AccountType.LIABILITY,
                subType: "LONG_TERM_LIABILITY",
              },
            },
            {
              ledgerAccount: {
                type: AccountType.EQUITY,
              },
            },
          ],
        },
        include: {
          ledgerAccount: true,
        },
      });

      const financingInflows = financingEntries.reduce((sum, entry) => {
        return sum + Number(entry.creditAmount);
      }, 0);

      const financingOutflows = financingEntries.reduce((sum, entry) => {
        return sum + Number(entry.debitAmount);
      }, 0);

      const netFinancingCashFlow = financingInflows - financingOutflows;

      const netCashFlow =
        netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

      // Get cash balance at start and end
      const startCashEntries = await db.journalEntry.findMany({
        where: {
          businessId,
          ledgerAccountId: { in: cashAccountIds },
          date: { lt: startDate },
        },
      });

      const cashAtStart = startCashEntries.reduce((sum, entry) => {
        return sum + (Number(entry.debitAmount) - Number(entry.creditAmount));
      }, 0);

      const cashAtEnd = cashAtStart + netCashFlow;

      return c.json({
        period: {
          startDate,
          endDate,
        },
        operating: {
          inflows: operatingInflows,
          outflows: operatingOutflows,
          net: netOperatingCashFlow,
        },
        investing: {
          inflows: investmentInflows,
          outflows: investmentOutflows,
          net: netInvestingCashFlow,
        },
        financing: {
          inflows: financingInflows,
          outflows: financingOutflows,
          net: netFinancingCashFlow,
        },
        netCashFlow,
        cashAtStart,
        cashAtEnd,
      });
    }
  );

export default app;
