/**
 * Dashboard Context (Redis-backed)
 *
 * Builds a compact, business-scoped “dashboard snapshot” from the database,
 * caches it in Upstash Redis, and provides a lightweight keyword search over
 * the snapshot so the agent can answer with highly relevant business data.
 */

import { db } from "@/lib/db";
import { getRedisClient } from "@/lib/upstash/redis";

type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

export type DashboardSnapshot = {
  businessId: string;
  generatedAt: number;
  period: {
    monthStartISO: string;
    nowISO: string;
    last90DaysStartISO: string;
  };
  kpis: {
    monthRevenue: number;
    monthExpenses: number;
    monthNetIncome: number;
    workingCapital: number;
    currentAssets: number;
    currentLiabilities: number;
    cashLike: number;
    burnRate3mo: number;
    runwayMonths: number | null;
  };
  accounts: Array<{
    id: string;
    name: string;
    code: string | null;
    type: string;
    subType: string | null;
    currentBalance: number;
  }>;
  recentTransactions: Array<{
    id: string;
    dateISO: string;
    type: string;
    description: string;
    amount: number;
    ledgerAccountName: string;
    categoryName: string | null;
  }>;
  expenseByCategory90d: Array<{
    categoryId: string | null;
    categoryName: string;
    total: number;
  }>;
};

const SNAPSHOT_TTL_SECONDS = 60 * 5; // 5 minutes
const DOC_TTL_SECONDS = 60 * 10; // 10 minutes

const keys = {
  snapshot: (businessId: string) => `agent:dash:snapshot:${businessId}`,
  doc: (businessId: string, docId: string) => `agent:dash:doc:${businessId}:${docId}`,
  idx: (businessId: string, token: string) => `agent:dash:idx:${businessId}:${token}`,
  docIds: (businessId: string) => `agent:dash:docs:${businessId}`,
} as const;

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  // Prisma Decimal
  if (typeof value === "object" && value && "toString" in (value as any)) {
    const s = (value as any).toString();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const tokens: string[] = [];
  for (const t of raw) {
    if (t.length < 3) continue;
    // avoid huge token sets
    if (tokens.length >= 12) break;
    tokens.push(t);
  }
  return Array.from(new Set(tokens));
}

function docTextFromSnapshot(snapshot: DashboardSnapshot): string {
  const k = snapshot.kpis;
  
  // Calculate financial health indicators
  const profitMargin = k.monthRevenue > 0 ? ((k.monthNetIncome / k.monthRevenue) * 100).toFixed(1) : "0";
  const currentRatio = k.currentLiabilities !== 0 ? (k.currentAssets / k.currentLiabilities).toFixed(2) : "N/A";
  const quickRatio = k.currentLiabilities !== 0 ? (k.cashLike / k.currentLiabilities).toFixed(2) : "N/A";
  
  // Financial health warnings
  const warnings: string[] = [];
  if (k.cashLike < 0) warnings.push("CRITICAL: Negative cash balance");
  if (k.cashLike > 0 && k.burnRate3mo > 0 && (k.runwayMonths ?? 0) < 3) {
    warnings.push(`URGENT: Only ${k.runwayMonths?.toFixed(1)} months of runway remaining`);
  }
  if (k.monthNetIncome < 0) warnings.push("WARNING: Operating at a loss this month");
  if (k.workingCapital < 0) warnings.push("WARNING: Negative working capital");
  
  // Positive indicators
  const strengths: string[] = [];
  if (k.monthNetIncome > 0 && Number(profitMargin) > 20) {
    strengths.push(`Strong profit margin at ${profitMargin}%`);
  }
  if (Number(currentRatio) > 2) {
    strengths.push("Excellent liquidity position");
  }
  if (k.cashLike > k.burnRate3mo * 6) {
    strengths.push("Healthy cash reserves (6+ months runway)");
  }
  
  const topCats = snapshot.expenseByCategory90d
    .slice(0, 6)
    .map((c) => `${c.categoryName}: $${c.total.toFixed(2)}`)
    .join("; ");

  const sections = [
    `=== FINANCIAL DASHBOARD (Generated ${new Date(snapshot.generatedAt).toLocaleString()}) ===`,
    ``,
    `PERIOD: ${new Date(snapshot.period.monthStartISO).toLocaleDateString()} - ${new Date(snapshot.period.nowISO).toLocaleDateString()}`,
    ``,
    `INCOME STATEMENT (This Month):`,
    `  Revenue: $${k.monthRevenue.toFixed(2)}`,
    `  Expenses: $${k.monthExpenses.toFixed(2)}`,
    `  Net Income: $${k.monthNetIncome.toFixed(2)} (${profitMargin}% margin)`,
    ``,
    `LIQUIDITY & CASH FLOW:`,
    `  Cash Balance: $${k.cashLike.toFixed(2)}`,
    `  Working Capital: $${k.workingCapital.toFixed(2)}`,
    `  Current Assets: $${k.currentAssets.toFixed(2)}`,
    `  Current Liabilities: $${k.currentLiabilities.toFixed(2)}`,
    `  Current Ratio: ${currentRatio}`,
    `  Quick Ratio: ${quickRatio}`,
    ``,
    `BURN RATE & RUNWAY (90-day avg):`,
    `  Monthly Burn Rate: $${k.burnRate3mo.toFixed(2)}`,
    `  Estimated Runway: ${k.runwayMonths ? `${k.runwayMonths.toFixed(1)} months` : "Infinite (profitable)"}`,
    ``,
    warnings.length > 0 ? `⚠️ FINANCIAL ALERTS:\n  - ${warnings.join("\\n  - ")}` : "",
    strengths.length > 0 ? `✅ FINANCIAL STRENGTHS:\n  - ${strengths.join("\\n  - ")}` : "",
    ``,
    topCats ? `TOP EXPENSE CATEGORIES (90 days): ${topCats}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  return sections;
}

type DashboardDoc = {
  id: string;
  kind: "kpi" | "account" | "transaction" | "category";
  text: string;
  scoreHints?: {
    timestamp?: number;
    amountAbs?: number;
  };
};

function buildDocs(snapshot: DashboardSnapshot): DashboardDoc[] {
  const docs: DashboardDoc[] = [];

  docs.push({
    id: "kpi",
    kind: "kpi",
    text: docTextFromSnapshot(snapshot),
    scoreHints: { timestamp: snapshot.generatedAt },
  });

  // Accounts
  for (const a of snapshot.accounts.slice(0, 60)) {
    docs.push({
      id: `acct_${a.id}`,
      kind: "account",
      text: `Account ${a.name} (${a.type}${a.subType ? "/" + a.subType : ""}${a.code ? ", code " + a.code : ""}) current balance: ${a.currentBalance}.`,
    });
  }

  // Recent transactions
  for (const t of snapshot.recentTransactions.slice(0, 60)) {
    docs.push({
      id: `tx_${t.id}`,
      kind: "transaction",
      text: `Transaction on ${t.dateISO}: ${t.type} ${t.amount}. Description: ${t.description}. Account: ${t.ledgerAccountName}.${t.categoryName ? " Category: " + t.categoryName + "." : ""}`,
      scoreHints: { timestamp: Date.parse(t.dateISO), amountAbs: Math.abs(t.amount) },
    });
  }

  // Categories
  for (const c of snapshot.expenseByCategory90d.slice(0, 30)) {
    docs.push({
      id: `cat_${c.categoryId ?? "uncategorized"}`,
      kind: "category",
      text: `Expense category ${c.categoryName} total in last 90 days: ${c.total}.`,
      scoreHints: { amountAbs: Math.abs(c.total) },
    });
  }

  return docs;
}

async function safeRedis<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    // If env not present, short-circuit.
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return fallback;
    }
    return await fn();
  } catch {
    return fallback;
  }
}

export async function buildDashboardSnapshot(businessId: string): Promise<DashboardSnapshot> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const last90 = daysAgo(now, 90);

  const [accounts, recentTransactions, expenseByCategory] = await Promise.all([
    db.ledgerAccount.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        subType: true,
        currentBalance: true,
      },
      orderBy: { name: "asc" },
    }),
    db.transaction.findMany({
      where: { businessId, date: { gte: last90 } },
      select: {
        id: true,
        date: true,
        type: true,
        description: true,
        amount: true,
        ledgerAccount: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 40,
    }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { businessId, type: "EXPENSE", date: { gte: last90 } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 12,
    }),
  ]);

  // Revenue/Expense aggregates from journal entries (statement-correct)
  const [revAgg, expAgg] = await Promise.all([
    db.journalEntry.aggregate({
      where: {
        businessId,
        isPosted: true,
        date: { gte: monthStart },
        ledgerAccount: { type: "REVENUE" },
      },
      _sum: { debitAmount: true, creditAmount: true },
    }),
    db.journalEntry.aggregate({
      where: {
        businessId,
        isPosted: true,
        date: { gte: monthStart },
        ledgerAccount: { type: "EXPENSE" },
      },
      _sum: { debitAmount: true, creditAmount: true },
    }),
  ]);

  const monthRevenue = toNumber(revAgg._sum.creditAmount) - toNumber(revAgg._sum.debitAmount);
  const monthExpenses = toNumber(expAgg._sum.debitAmount) - toNumber(expAgg._sum.creditAmount);
  const monthNetIncome = monthRevenue - monthExpenses;

  // Working capital from balances
  const currentAssets = accounts
    .filter((a) => a.type === "ASSET" && a.subType === "CURRENT_ASSET")
    .reduce((sum, a) => sum + toNumber(a.currentBalance), 0);

  const currentLiabilities = accounts
    .filter((a) => a.type === "LIABILITY" && a.subType === "CURRENT_LIABILITY")
    .reduce((sum, a) => sum + toNumber(a.currentBalance), 0);

  const workingCapital = currentAssets - currentLiabilities;

  // Cash-like heuristic: current assets whose name/code suggests cash/bank
  const cashLike = accounts
    .filter((a) => a.type === "ASSET")
    .filter((a) => {
      const name = a.name.toLowerCase();
      const code = (a.code ?? "").toLowerCase();
      return (
        name.includes("cash") ||
        name.includes("bank") ||
        name.includes("checking") ||
        name.includes("savings") ||
        code.startsWith("10")
      );
    })
    .reduce((sum, a) => sum + toNumber(a.currentBalance), 0);

  // Burn rate: average monthly expenses over last 90 days
  const exp90Agg = await db.journalEntry.aggregate({
    where: {
      businessId,
      isPosted: true,
      date: { gte: last90 },
      ledgerAccount: { type: "EXPENSE" },
    },
    _sum: { debitAmount: true, creditAmount: true },
  });
  const expenses90 = toNumber(exp90Agg._sum.debitAmount) - toNumber(exp90Agg._sum.creditAmount);
  const burnRate3mo = expenses90 / 3;
  const runwayMonths = burnRate3mo > 0 ? cashLike / burnRate3mo : null;

  // Resolve category names for expense breakdown
  const categoryIds = expenseByCategory.map((g) => g.categoryId).filter((id): id is string => !!id);
  const categories = categoryIds.length
    ? await db.category.findMany({
        where: { businessId, id: { in: categoryIds } },
        select: { id: true, name: true },
      })
    : [];
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const snapshot: DashboardSnapshot = {
    businessId,
    generatedAt: Date.now(),
    period: {
      monthStartISO: monthStart.toISOString(),
      nowISO: now.toISOString(),
      last90DaysStartISO: last90.toISOString(),
    },
    kpis: {
      monthRevenue: Number(monthRevenue.toFixed(2)),
      monthExpenses: Number(monthExpenses.toFixed(2)),
      monthNetIncome: Number(monthNetIncome.toFixed(2)),
      workingCapital: Number(workingCapital.toFixed(2)),
      currentAssets: Number(currentAssets.toFixed(2)),
      currentLiabilities: Number(currentLiabilities.toFixed(2)),
      cashLike: Number(cashLike.toFixed(2)),
      burnRate3mo: Number(burnRate3mo.toFixed(2)),
      runwayMonths: runwayMonths == null ? null : Number(runwayMonths.toFixed(2)),
    },
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      code: a.code,
      type: a.type,
      subType: a.subType,
      currentBalance: Number(toNumber(a.currentBalance).toFixed(2)),
    })),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      dateISO: t.date.toISOString(),
      type: t.type,
      description: t.description,
      amount: Number(toNumber(t.amount).toFixed(2)),
      ledgerAccountName: t.ledgerAccount.name,
      categoryName: t.category?.name ?? null,
    })),
    expenseByCategory90d: expenseByCategory.map((g) => ({
      categoryId: g.categoryId,
      categoryName: g.categoryId ? categoryNameById.get(g.categoryId) ?? "Unknown" : "Uncategorized",
      total: Number(toNumber(g._sum.amount).toFixed(2)),
    })),
  };

  return snapshot;
}

export async function cacheDashboardSnapshot(snapshot: DashboardSnapshot): Promise<void> {
  await safeRedis(async () => {
    const redis = getRedisClient();
    const snapshotKey = keys.snapshot(snapshot.businessId);

    await redis.set(snapshotKey, snapshot as unknown as JsonValue, { ex: SNAPSHOT_TTL_SECONDS });

    // Index docs for search
    const docs = buildDocs(snapshot);

    // Track doc ids
    const docIdSetKey = keys.docIds(snapshot.businessId);

    // Rebuild index quickly: expire old docId set; token sets expire naturally
    await redis.del(docIdSetKey);

    for (const d of docs) {
      const docKey = keys.doc(snapshot.businessId, d.id);
      await redis.set(docKey, d as unknown as JsonValue, { ex: DOC_TTL_SECONDS });
      await redis.sadd(docIdSetKey, d.id);
      await redis.expire(docIdSetKey, DOC_TTL_SECONDS);

      const toks = tokenize(d.text);
      for (const tok of toks) {
        const idxKey = keys.idx(snapshot.businessId, tok);
        await redis.sadd(idxKey, d.id);
        await redis.expire(idxKey, DOC_TTL_SECONDS);
      }
    }

    return true;
  }, false);
}

export async function getCachedDashboardSnapshot(businessId: string): Promise<DashboardSnapshot | null> {
  return await safeRedis(async () => {
    const redis = getRedisClient();
    const value = await redis.get<DashboardSnapshot>(keys.snapshot(businessId));
    return value ?? null;
  }, null);
}

export async function searchDashboardContext(
  businessId: string,
  query: string,
  options?: { maxDocs?: number }
): Promise<string> {
  const maxDocs = options?.maxDocs ?? 6;

  const tokens = tokenize(query);
  if (tokens.length === 0) return "";

  // Try Redis inverted index first
  const fromRedis = await safeRedis(async () => {
    const redis = getRedisClient();

    const docScores = new Map<string, number>();

    for (const tok of tokens) {
        // Upstash typings constrain SMEMBERS generic to arrays; we want string[].
        const ids = ((await redis.smembers<string[]>(keys.idx(businessId, tok))) ?? []) as string[];
      for (const id of ids) {
        docScores.set(id, (docScores.get(id) ?? 0) + 1);
      }
    }

    const ranked = Array.from(docScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxDocs)
      .map(([id]) => id);

    if (ranked.length === 0) return "";

    const docs = await Promise.all(
      ranked.map((id) => redis.get<DashboardDoc>(keys.doc(businessId, id)))
    );

    const lines = docs
      .filter((d): d is DashboardDoc => !!d)
      .map((d) => d.text.trim())
      .filter(Boolean);

    return lines.join("\n");
  }, "");

  if (fromRedis) return fromRedis;

  // Fallback: if Redis search unavailable, build a snapshot and do a simple in-memory match.
  const snapshot = await buildDashboardSnapshot(businessId);
  const docs = buildDocs(snapshot);

  const scored = docs
    .map((d) => {
      const t = d.text.toLowerCase();
      const score = tokens.reduce((s, tok) => s + (t.includes(tok) ? 1 : 0), 0);
      const timeBoost = d.scoreHints?.timestamp ? clamp((Date.now() - d.scoreHints.timestamp) / (1000 * 60 * 60 * 24), 0, 7) : 0;
      return { d, score, timeBoost };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score + (a.timeBoost - b.timeBoost) * 0.01)
    .slice(0, maxDocs)
    .map((x) => x.d.text.trim());

  return scored.join("\n");
}

export async function getDashboardContextForAgent(
  businessId: string,
  query: string
): Promise<{ snapshot: DashboardSnapshot | null; contextText: string }>
{
  // Prefer cached snapshot
  let snapshot = await getCachedDashboardSnapshot(businessId);

  // Refresh snapshot if missing
  if (!snapshot) {
    try {
      snapshot = await buildDashboardSnapshot(businessId);
      // best-effort cache
      await cacheDashboardSnapshot(snapshot);
    } catch {
      snapshot = null;
    }
  }

  const contextText = await searchDashboardContext(businessId, query, { maxDocs: 6 });
  return { snapshot, contextText };
}
