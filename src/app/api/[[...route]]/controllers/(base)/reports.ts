import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { db } from "@/lib/db";
import { AccountType, AccountSubType } from "@/generated/prisma";

const app = new Hono()
  // Get Balance Sheet
  .get(
    "/balance-sheet",
    zValidator(
      "query",
      z.object({
        businessId: z.string(),
        date: z.string().transform((val) => new Date(val)),
      })
    ),
    async (c) => {
      const { businessId, date } = c.req.valid("query");

      // Get all asset, liability, and equity accounts with their balances
      const accounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          isActive: true,
          type: {
            in: [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY],
          },
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

      // Calculate balances for each account
      const accountsWithBalances = accounts.map((account) => {
        // Use journal entries for accurate as-of-date balance
        const totalDebits = account.journalEntries.reduce(
          (sum, entry) => sum + Number(entry.debitAmount || 0),
          0
        );
        const totalCredits = account.journalEntries.reduce(
          (sum, entry) => sum + Number(entry.creditAmount || 0),
          0
        );

        const balance =
          account.normalBalance === "DEBIT"
            ? totalDebits - totalCredits
            : totalCredits - totalDebits;

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          subType: account.subType || null,
          balance: Math.abs(balance), // Ensure positive display
        };
      });

      // Group by type and subtype
      const assets = {
        currentAssets: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.ASSET &&
            (a.subType === AccountSubType.CURRENT_ASSET || (!a.subType && a.code?.startsWith('1')))
        ),
        fixedAssets: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.ASSET &&
            a.subType === AccountSubType.FIXED_ASSET
        ),
        otherAssets: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.ASSET &&
            (a.subType === AccountSubType.OTHER_ASSET || (a.type === AccountType.ASSET && !a.subType && !a.code?.startsWith('1')))
        ),
      };

      const liabilities = {
        currentLiabilities: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.LIABILITY &&
            a.subType === AccountSubType.CURRENT_LIABILITY
        ),
        longTermLiabilities: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.LIABILITY &&
            a.subType === AccountSubType.LONG_TERM_LIABILITY
        ),
        otherLiabilities: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.LIABILITY &&
            a.subType === AccountSubType.OTHER_LIABILITY
        ),
      };

      const equity = {
        ownersEquity: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.EQUITY &&
            a.subType === AccountSubType.OWNERS_EQUITY
        ),
        retainedEarnings: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.EQUITY &&
            a.subType === AccountSubType.RETAINED_EARNINGS
        ),
      };

      // Calculate totals
      const totalCurrentAssets = assets.currentAssets.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalFixedAssets = assets.fixedAssets.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalOtherAssets = assets.otherAssets.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalAssets =
        totalCurrentAssets + totalFixedAssets + totalOtherAssets;

      const totalCurrentLiabilities = liabilities.currentLiabilities.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalLongTermLiabilities = liabilities.longTermLiabilities.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalOtherLiabilities = liabilities.otherLiabilities.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalLiabilities =
        totalCurrentLiabilities +
        totalLongTermLiabilities +
        totalOtherLiabilities;

      const totalOwnersEquity = equity.ownersEquity.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalRetainedEarnings = equity.retainedEarnings.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalEquity = totalOwnersEquity + totalRetainedEarnings;

      const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

      return c.json({
        date,
        assets: {
          currentAssets: {
            accounts: assets.currentAssets,
            total: totalCurrentAssets,
          },
          fixedAssets: {
            accounts: assets.fixedAssets,
            total: totalFixedAssets,
          },
          otherAssets: {
            accounts: assets.otherAssets,
            total: totalOtherAssets,
          },
          total: totalAssets,
        },
        liabilities: {
          currentLiabilities: {
            accounts: liabilities.currentLiabilities,
            total: totalCurrentLiabilities,
          },
          longTermLiabilities: {
            accounts: liabilities.longTermLiabilities,
            total: totalLongTermLiabilities,
          },
          otherLiabilities: {
            accounts: liabilities.otherLiabilities,
            total: totalOtherLiabilities,
          },
          total: totalLiabilities,
        },
        equity: {
          ownersEquity: {
            accounts: equity.ownersEquity,
            total: totalOwnersEquity,
          },
          retainedEarnings: {
            accounts: equity.retainedEarnings,
            total: totalRetainedEarnings,
          },
          total: totalEquity,
        },
        totals: {
          assets: totalAssets,
          liabilitiesAndEquity: totalLiabilitiesAndEquity,
          difference: totalAssets - totalLiabilitiesAndEquity,
          isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
        },
        metrics: {
          workingCapital: totalCurrentAssets - totalCurrentLiabilities,
          currentRatio:
            totalCurrentLiabilities > 0
              ? totalCurrentAssets / totalCurrentLiabilities
              : 0,
          debtToEquityRatio:
            totalEquity > 0 ? totalLiabilities / totalEquity : 0,
        },
      });
    }
  )

  // Get Profit & Loss Statement (Income Statement)
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

      // Get all revenue and expense accounts with their entries for the period
      const accounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          isActive: true,
          type: {
            in: [AccountType.REVENUE, AccountType.EXPENSE],
          },
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
        orderBy: { code: "asc" },
      });

      // Calculate balances for each account
      const accountsWithBalances = accounts.map((account) => {
        const totalDebits = account.journalEntries.reduce(
          (sum, entry) => sum + Number(entry.debitAmount || 0),
          0
        );
        const totalCredits = account.journalEntries.reduce(
          (sum, entry) => sum + Number(entry.creditAmount || 0),
          0
        );

        const balance =
          account.normalBalance === "DEBIT"
            ? totalDebits - totalCredits
            : totalCredits - totalDebits;

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          subType: account.subType || null,
          balance: Math.abs(balance), // Ensure positive amounts
        };
      });

      // Group revenue and expenses (include accounts without subtype)
      const revenue = {
        operatingRevenue: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.REVENUE &&
            (a.subType === AccountSubType.OPERATING_REVENUE || (!a.subType && a.code?.startsWith('4')))
        ),
        otherRevenue: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.REVENUE &&
            (a.subType === AccountSubType.OTHER_REVENUE || (a.type === AccountType.REVENUE && !a.subType && !a.code?.startsWith('4')))
        ),
      };

      const expenses = {
        costOfGoodsSold: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.EXPENSE &&
            (a.subType === AccountSubType.COST_OF_GOODS_SOLD || (!a.subType && a.code?.startsWith('5')))
        ),
        operatingExpenses: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.EXPENSE &&
            (a.subType === AccountSubType.OPERATING_EXPENSE || (!a.subType && a.code?.startsWith('6')))
        ),
        otherExpenses: accountsWithBalances.filter(
          (a) =>
            a.type === AccountType.EXPENSE &&
            (a.subType === AccountSubType.OTHER_EXPENSE || (a.type === AccountType.EXPENSE && !a.subType && !a.code?.startsWith('5') && !a.code?.startsWith('6')))
        ),
      };

      // Calculate totals
      const totalOperatingRevenue = revenue.operatingRevenue.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalOtherRevenue = revenue.otherRevenue.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const totalRevenue = totalOperatingRevenue + totalOtherRevenue;

      const totalCOGS = expenses.costOfGoodsSold.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const grossProfit = totalRevenue - totalCOGS;

      const totalOperatingExpenses = expenses.operatingExpenses.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const operatingIncome = grossProfit - totalOperatingExpenses;

      const totalOtherExpenses = expenses.otherExpenses.reduce(
        (sum, a) => sum + a.balance,
        0
      );
      const netIncome = operatingIncome - totalOtherExpenses;

      const totalExpenses = totalCOGS + totalOperatingExpenses + totalOtherExpenses;

      return c.json({
        startDate,
        endDate,
        revenue: {
          operatingRevenue: {
            accounts: revenue.operatingRevenue,
            total: totalOperatingRevenue,
          },
          otherRevenue: {
            accounts: revenue.otherRevenue,
            total: totalOtherRevenue,
          },
          total: totalRevenue,
        },
        expenses: {
          costOfGoodsSold: {
            accounts: expenses.costOfGoodsSold,
            total: totalCOGS,
          },
          operatingExpenses: {
            accounts: expenses.operatingExpenses,
            total: totalOperatingExpenses,
          },
          otherExpenses: {
            accounts: expenses.otherExpenses,
            total: totalOtherExpenses,
          },
          total: totalExpenses,
        },
        summary: {
          totalRevenue,
          grossProfit,
          grossProfitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
          operatingIncome,
          operatingMargin: totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0,
          netIncome,
          netProfitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        },
      });
    }
  )

  // Get Cash Flow Statement
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

      // Get cash accounts
      const cashAccounts = await db.ledgerAccount.findMany({
        where: {
          businessId,
          type: AccountType.ASSET,
          isActive: true,
          OR: [
            { name: { contains: "Cash", mode: "insensitive" } },
            { name: { contains: "Bank", mode: "insensitive" } },
            { code: { startsWith: "10" } },
            { subType: AccountSubType.CURRENT_ASSET },
          ],
        },
      });

      const cashAccountIds = cashAccounts.map((a) => a.id);

      // Get all transactions affecting cash
      const transactions = await db.transaction.findMany({
        where: {
          businessId,
          ledgerAccountId: { in: cashAccountIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          category: true,
          journalEntries: {
            include: {
              ledgerAccount: true,
            },
          },
        },
        orderBy: { date: "asc" },
      });

      // Categorize cash flows
      const operating: any[] = [];
      const investing: any[] = [];
      const financing: any[] = [];

      transactions.forEach((transaction) => {
        const cashFlow = {
          date: transaction.date,
          description: transaction.description,
          amount:
            transaction.type === "INCOME"
              ? Number(transaction.amount)
              : -Number(transaction.amount),
          category: transaction.category?.name,
        };

        // Simple categorization logic (you can enhance this)
        const contraAccount = transaction.journalEntries.find(
          (e) => !cashAccountIds.includes(e.ledgerAccountId)
        )?.ledgerAccount;

        if (contraAccount?.type === AccountType.REVENUE || 
            contraAccount?.type === AccountType.EXPENSE ||
            contraAccount?.subType === AccountSubType.CURRENT_ASSET ||
            contraAccount?.subType === AccountSubType.CURRENT_LIABILITY) {
          operating.push(cashFlow);
        } else if (contraAccount?.subType === AccountSubType.FIXED_ASSET) {
          investing.push(cashFlow);
        } else {
          financing.push(cashFlow);
        }
      });

      const operatingCashFlow = operating.reduce((sum, t) => sum + t.amount, 0);
      const investingCashFlow = investing.reduce((sum, t) => sum + t.amount, 0);
      const financingCashFlow = financing.reduce((sum, t) => sum + t.amount, 0);
      const netCashFlow =
        operatingCashFlow + investingCashFlow + financingCashFlow;

      // Get opening cash balance
      const openingBalanceEntries = await db.journalEntry.findMany({
        where: {
          businessId,
          ledgerAccountId: { in: cashAccountIds },
          date: { lt: startDate },
        },
      });

      const openingBalance = openingBalanceEntries.reduce((sum, entry) => {
        const account = cashAccounts.find((a) => a.id === entry.ledgerAccountId);
        const change =
          account?.normalBalance === "DEBIT"
            ? Number(entry.debitAmount) - Number(entry.creditAmount)
            : Number(entry.creditAmount) - Number(entry.debitAmount);
        return sum + change;
      }, 0);

      const closingBalance = openingBalance + netCashFlow;

      return c.json({
        startDate,
        endDate,
        operating: {
          transactions: operating,
          total: operatingCashFlow,
        },
        investing: {
          transactions: investing,
          total: investingCashFlow,
        },
        financing: {
          transactions: financing,
          total: financingCashFlow,
        },
        summary: {
          openingBalance,
          operatingCashFlow,
          investingCashFlow,
          financingCashFlow,
          netCashFlow,
          closingBalance,
        },
      });
    }
  );

export default app;
