/**
 * Financial Data Indexer
 *
 * Automatically indexes business financial data into Upstash Vector
 * for fast semantic search during voice assistant queries.
 */

import { db } from "@/lib/db";
import { generateEmbeddings } from "./embeddings";
import { upsertVectors } from "@/lib/upstash/vector";
import type { VectorMetadata } from "@/lib/upstash/vector";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Check if vector indexing is available
 */
function isVectorAvailable(): boolean {
  return !!(
    process.env.UPSTASH_VECTOR_REST_URL &&
    process.env.UPSTASH_VECTOR_REST_TOKEN &&
    process.env.GOOGLE_GEMINI_API_KEY
  );
}

/**
 * Format transaction as searchable text
 */
function formatTransaction(tx: any): string {
  const date = new Date(tx.date).toLocaleDateString();
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(tx.amount);

  return `Transaction on ${date}: ${tx.type} of ${amount}. 
Description: ${tx.description}. 
Account: ${tx.ledgerAccount.name}${
    tx.category ? `. Category: ${tx.category.name}` : ""
  }.
${tx.isReconciled ? "Reconciled" : "Pending reconciliation"}.`;
}

/**
 * Format ledger account as searchable text
 */
function formatLedgerAccount(account: any): string {
  const balance = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(account.currentBalance);

  return `Ledger Account: ${account.name}${account.code ? ` (Code: ${account.code})` : ""}.
Type: ${account.type}${account.subType ? `, ${account.subType}` : ""}.
Current Balance: ${balance}.
Normal Balance: ${account.normalBalance}.
${account.description ? `Description: ${account.description}` : ""}
${account.isActive ? "Active" : "Inactive"}.`;
}

/**
 * Format analytics summary as searchable text
 */
function formatAnalytics(analytics: any, businessId: string): string {
  const sections: string[] = [];

  // Cash position
  if (analytics.cash) {
    const cash = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(analytics.cash.current);
    sections.push(
      `Current cash balance: ${cash}. Cash change: ${analytics.cash.change.toFixed(1)}%.`
    );
  }

  // Revenue
  if (analytics.revenue) {
    const revenue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(analytics.revenue.monthly);
    sections.push(
      `Monthly revenue: ${revenue}. Revenue change: ${analytics.revenue.change.toFixed(1)}%.`
    );
  }

  // Expenses
  if (analytics.expenses) {
    const expenses = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(analytics.expenses.monthly);
    sections.push(
      `Monthly expenses: ${expenses}. Expense change: ${analytics.expenses.change.toFixed(1)}%.`
    );
  }

  // Net income
  if (analytics.netIncome) {
    const netIncome = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(analytics.netIncome.monthly);
    sections.push(
      `Net income: ${netIncome}. Profit margin: ${analytics.netIncome.margin.toFixed(1)}%.`
    );
  }

  // Working capital
  if (analytics.workingCapital) {
    const wc = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(analytics.workingCapital.amount);
    sections.push(
      `Working capital: ${wc}. Current ratio: ${analytics.workingCapital.currentRatio.toFixed(2)}.`
    );
  }

  // Burn rate
  if (analytics.burnRate) {
    const burnRate = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(analytics.burnRate.monthly);
    const runway =
      analytics.burnRate.runwayMonths === Infinity
        ? "Infinite (profitable)"
        : `${analytics.burnRate.runwayMonths.toFixed(1)} months`;
    sections.push(`Monthly burn rate: ${burnRate}. Runway: ${runway}.`);
  }

  return `Financial Overview:\n${sections.join("\n")}`;
}

/**
 * Index recent transactions for a business
 */
export async function indexRecentTransactions(
  businessId: string,
  limit: number = 50
): Promise<number> {
  if (!isVectorAvailable()) {
    if (IS_DEV) console.log("[Indexer] Vector indexing not available");
    return 0;
  }

  try {
    // Fetch recent transactions
    const transactions = await db.transaction.findMany({
      where: { businessId },
      include: {
        ledgerAccount: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    if (transactions.length === 0) return 0;

    // Format as text
    const texts = transactions.map(formatTransaction);

    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(texts);

    // Prepare vector data
    const vectors = transactions.map((tx, i) => ({
      id: `${businessId}_tx_${tx.id}`,
      embedding: embeddings[i],
      metadata: {
        businessId,
        text: texts[i],
        source: "transaction",
        sourceId: tx.id,
        category: "transaction",
        createdAt: Date.now(),
      } as VectorMetadata,
    }));

    // Upsert to Upstash Vector
    await upsertVectors(vectors);

    if (IS_DEV) {
      console.log(`[Indexer] Indexed ${transactions.length} transactions`);
    }

    return transactions.length;
  } catch (error) {
    console.error("[Indexer] Failed to index transactions:", error);
    return 0;
  }
}

/**
 * Index all active ledger accounts for a business
 */
export async function indexLedgerAccounts(businessId: string): Promise<number> {
  if (!isVectorAvailable()) {
    if (IS_DEV) console.log("[Indexer] Vector indexing not available");
    return 0;
  }

  try {
    // Fetch active accounts
    const accounts = await db.ledgerAccount.findMany({
      where: { businessId, isActive: true },
      orderBy: { name: "asc" },
    });

    if (accounts.length === 0) return 0;

    // Format as text
    const texts = accounts.map(formatLedgerAccount);

    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(texts);

    // Prepare vector data
    const vectors = accounts.map((account, i) => ({
      id: `${businessId}_acc_${account.id}`,
      embedding: embeddings[i],
      metadata: {
        businessId,
        text: texts[i],
        source: "ledger_account",
        sourceId: account.id,
        category: account.type,
        createdAt: Date.now(),
      } as VectorMetadata,
    }));

    // Upsert to Upstash Vector
    await upsertVectors(vectors);

    if (IS_DEV) {
      console.log(`[Indexer] Indexed ${accounts.length} ledger accounts`);
    }

    return accounts.length;
  } catch (error) {
    console.error("[Indexer] Failed to index ledger accounts:", error);
    return 0;
  }
}

/**
 * Index analytics summary for a business
 */
export async function indexAnalyticsSummary(
  businessId: string
): Promise<number> {
  if (!isVectorAvailable()) {
    if (IS_DEV) console.log("[Indexer] Vector indexing not available");
    return 0;
  }

  try {
    // Fetch analytics data via API-like logic (reuse from analytics controller)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(1);

    // Get cash accounts
    const cashAccounts = await db.ledgerAccount.findMany({
      where: {
        businessId,
        type: "ASSET",
        isActive: true,
        OR: [
          { name: { contains: "Cash", mode: "insensitive" } },
          { name: { contains: "Bank", mode: "insensitive" } },
          { code: { startsWith: "10" } },
        ],
      },
    });

    const totalCash = cashAccounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    );

    // Get revenue accounts
    const revenueAccounts = await db.ledgerAccount.findMany({
      where: { businessId, type: "REVENUE" },
      include: {
        journalEntries: {
          where: { date: { gte: startDate, lte: endDate } },
        },
      },
    });

    const monthlyRevenue = revenueAccounts.reduce((sum, acc) => {
      const accRevenue = acc.journalEntries.reduce(
        (bal, entry) =>
          bal + (Number(entry.creditAmount) - Number(entry.debitAmount)),
        0
      );
      return sum + Math.abs(accRevenue);
    }, 0);

    // Get expense accounts
    const expenseAccounts = await db.ledgerAccount.findMany({
      where: { businessId, type: "EXPENSE" },
      include: {
        journalEntries: {
          where: { date: { gte: startDate, lte: endDate } },
        },
      },
    });

    const monthlyExpenses = expenseAccounts.reduce((sum, acc) => {
      const accExpense = acc.journalEntries.reduce(
        (bal, entry) =>
          bal + (Number(entry.debitAmount) - Number(entry.creditAmount)),
        0
      );
      return sum + Math.abs(accExpense);
    }, 0);

    // Calculate metrics
    const netIncome = monthlyRevenue - monthlyExpenses;
    const profitMargin =
      monthlyRevenue > 0 ? (netIncome / monthlyRevenue) * 100 : 0;

    // Get working capital
    const currentAssets = await db.ledgerAccount.findMany({
      where: {
        businessId,
        type: "ASSET",
        subType: "CURRENT_ASSET",
        isActive: true,
      },
    });

    const totalCurrentAssets = currentAssets.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    );

    const currentLiabilities = await db.ledgerAccount.findMany({
      where: {
        businessId,
        type: "LIABILITY",
        subType: "CURRENT_LIABILITY",
        isActive: true,
      },
    });

    const totalCurrentLiabilities = currentLiabilities.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    );

    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const currentRatio =
      totalCurrentLiabilities > 0
        ? totalCurrentAssets / totalCurrentLiabilities
        : 0;

    // Calculate burn rate
    const threeMonthsAgo = new Date(endDate);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const burnRateExpenses = await db.ledgerAccount.findMany({
      where: { businessId, type: "EXPENSE", isActive: true },
      include: {
        journalEntries: {
          where: { date: { gte: threeMonthsAgo, lte: endDate } },
        },
      },
    });

    const totalBurnRateExpenses = burnRateExpenses.reduce((sum, acc) => {
      const accExpense = acc.journalEntries.reduce(
        (bal, entry) =>
          bal + (Number(entry.debitAmount) - Number(entry.creditAmount)),
        0
      );
      return sum + Math.abs(accExpense);
    }, 0);

    const burnRate = totalBurnRateExpenses / 3;
    const runway = burnRate > 0 ? totalCash / burnRate : Infinity;

    // Build analytics object
    const analytics = {
      cash: { current: totalCash, change: 0 },
      revenue: { monthly: monthlyRevenue, change: 0 },
      expenses: { monthly: monthlyExpenses, change: 0 },
      netIncome: { monthly: netIncome, margin: profitMargin },
      workingCapital: { amount: workingCapital, currentRatio },
      burnRate: { monthly: burnRate, runwayMonths: runway },
    };

    // Format as text
    const text = formatAnalytics(analytics, businessId);

    // Generate embedding
    const [embedding] = await generateEmbeddings([text]);

    // Upsert to Upstash Vector
    await upsertVectors([
      {
        id: `${businessId}_analytics_summary`,
        embedding,
        metadata: {
          businessId,
          text,
          source: "analytics",
          sourceId: "summary",
          category: "financial_overview",
          createdAt: Date.now(),
        },
      },
    ]);

    if (IS_DEV) {
      console.log("[Indexer] Indexed analytics summary");
    }

    return 1;
  } catch (error) {
    console.error("[Indexer] Failed to index analytics:", error);
    return 0;
  }
}

/**
 * Index all financial data for a business (comprehensive)
 * Call this after dashboard context refresh or periodically
 */
export async function indexBusinessFinancialData(
  businessId: string
): Promise<{ indexed: number; errors: number }> {
  if (!isVectorAvailable()) {
    if (IS_DEV) {
      console.log(
        "[Indexer] Skipping indexing - Upstash Vector or Gemini not configured"
      );
    }
    return { indexed: 0, errors: 0 };
  }

  if (IS_DEV) {
    console.log(`[Indexer] Starting comprehensive indexing for ${businessId}`);
  }

  const results = await Promise.allSettled([
    indexRecentTransactions(businessId, 50),
    indexLedgerAccounts(businessId),
    indexAnalyticsSummary(businessId),
  ]);

  const indexed = results
    .filter((r) => r.status === "fulfilled")
    .reduce((sum, r: any) => sum + r.value, 0);

  const errors = results.filter((r) => r.status === "rejected").length;

  if (IS_DEV) {
    console.log(
      `[Indexer] Completed: ${indexed} documents indexed, ${errors} errors`
    );
  }

  return { indexed, errors };
}
