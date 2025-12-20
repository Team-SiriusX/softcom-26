/**
 * Fetch Historical Data Node - Retrieves or generates realistic timeline
 */

import { RedisCache } from "../utils/redis-cache";
import type { SimulatorState, TimelinePoint } from "../state/simulator-state";
import { db } from "@/lib/db";

export async function fetchDataNode(state: SimulatorState): Promise<Partial<SimulatorState>> {
  const redis = new RedisCache();

  try {
    // Check cache first
    const cached = await redis.getRealityTimeline(state.businessId);
    if (cached) {
      console.log("✅ Loaded timeline from cache");
      return {
        realityTimeline: cached,
        processingSteps: [...state.processingSteps, "Loaded from cache"],
      };
    }

    // Fetch from database or generate realistic data
    const timeline = await fetchOrGenerateTimeline(state.businessId);

    // Cache for 1 hour
    await redis.setRealityTimeline(state.businessId, timeline);

    console.log("✅ Fetched historical data");

    return {
      realityTimeline: timeline,
      processingSteps: [...state.processingSteps, "Fetched historical data"],
    };
  } catch (error) {
    console.error("❌ Fetch data error:", error);
    return {
      errors: [...(state.errors || []), `Data fetch error: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}

/**
 * Fetch real transaction data or generate realistic timeline
 */
async function fetchOrGenerateTimeline(businessId: string): Promise<TimelinePoint[]> {
  try {
    // Try to fetch real transaction data from database
    const realTimeline = await fetchRealTransactions(businessId);
    if (realTimeline && realTimeline.length > 0) {
      return realTimeline;
    }

    // Fallback to realistic generated data
    return generateRealisticTimeline(businessId);
  } catch (error) {
    console.error("Error fetching transactions, using generated data:", error);
    return generateRealisticTimeline(businessId);
  }
}

/**
 * Fetch real transaction data from database
 */
async function fetchRealTransactions(businessId: string): Promise<TimelinePoint[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Get transactions from the last 6 months
  const transactions = await db.transaction.findMany({
    where: {
      businessId,
      date: {
        gte: sixMonthsAgo,
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  if (transactions.length === 0) {
    return [];
  }

  // Group by month
  const monthlyData = new Map<string, { revenue: number; expenses: number; events: string[] }>();

  transactions.forEach((tx) => {
    const month = tx.date.toISOString().slice(0, 7);
    const existing = monthlyData.get(month) || { revenue: 0, expenses: 0, events: [] };

    if (tx.type === "INCOME") {
      existing.revenue += Number(tx.amount);
      existing.events.push(`Income: ${tx.description}`);
    } else if (tx.type === "EXPENSE") {
      existing.expenses += Number(tx.amount);
      existing.events.push(`Expense: ${tx.description}`);
    }

    monthlyData.set(month, existing);
  });

  // Convert to timeline
  const timeline: TimelinePoint[] = [];
  let balance = 0;

  const sortedMonths = Array.from(monthlyData.keys()).sort();

  for (const month of sortedMonths) {
    const data = monthlyData.get(month)!;
    balance += data.revenue - data.expenses;

    timeline.push({
      month,
      balance: Math.round(balance),
      revenue: Math.round(data.revenue),
      expenses: Math.round(data.expenses),
      events: data.events.slice(0, 5), // Limit events
      metadata: {
        revenueGrowth: 0,
        keyDrivers: ["Real transaction data"],
      },
    });
  }

  // Ensure we have exactly 6 months
  while (timeline.length < 6) {
    const lastMonth = timeline.length > 0 ? new Date(timeline[timeline.length - 1].month) : new Date();
    const newMonth = new Date(lastMonth);
    newMonth.setMonth(newMonth.getMonth() - (6 - timeline.length));

    timeline.unshift({
      month: newMonth.toISOString().slice(0, 7),
      balance: 0,
      revenue: 0,
      expenses: 0,
      events: ["No data"],
      metadata: {},
    });
  }

  return timeline.slice(-6); // Last 6 months
}

/**
 * Generate realistic timeline with seasonal patterns
 */
function generateRealisticTimeline(businessId: string): TimelinePoint[] {
  const timeline: TimelinePoint[] = [];
  let balance = 15000 + Math.random() * 10000; // Random starting balance

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    // Realistic revenue with seasonality
    const baseRevenue = 20000 + Math.random() * 10000; // $20k-$30k base
    const seasonal = 1 + Math.sin((date.getMonth() / 12) * Math.PI * 2) * 0.15; // ±15% seasonal variation
    const random = 0.95 + Math.random() * 0.1; // ±5% random variation
    const revenue = Math.round(baseRevenue * seasonal * random);

    // Expenses with some variance (70-80% of revenue)
    const expenses = Math.round(revenue * (0.70 + Math.random() * 0.1));

    balance += revenue - expenses;

    const prevRevenue = timeline.length > 0 ? timeline[timeline.length - 1].revenue : revenue;
    const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    timeline.push({
      month: date.toISOString().slice(0, 7),
      balance: Math.round(balance),
      revenue,
      expenses,
      events: ["Normal operations", `Revenue ${revenue >= prevRevenue ? "increased" : "decreased"}`],
      metadata: {
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        keyDrivers: ["Generated data based on realistic patterns"],
      },
    });
  }

  return timeline;
}
