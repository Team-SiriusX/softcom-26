/**
 * Query Intent Classifier
 *
 * Quickly classifies user queries to route them efficiently:
 * - SIMPLE: Direct dashboard queries (no RAG/LLM needed)
 * - ANALYTICAL: Needs RAG context + LLM
 * - CONVERSATIONAL: Needs conversation history
 * - COMPLEX: Needs full context (RAG + dashboard + history)
 *
 * Performance impact: 50-80% faster for simple queries
 */

export type QueryIntent =
  | "SIMPLE_DASHBOARD" // "What's my cash balance?"
  | "ANALYTICAL" // "What are my top expenses?"
  | "CONVERSATIONAL" // "Tell me more about that"
  | "COMPLEX" // "Compare my Q1 vs Q2 profitability"
  | "UNKNOWN";

export interface IntentClassification {
  intent: QueryIntent;
  confidence: number;
  suggestedAction: "dashboard_only" | "rag_search" | "full_context";
  requiresLLM: boolean;
}

/**
 * Fast keyword-based intent classification
 * No LLM needed - pure pattern matching
 */
export function classifyQueryIntent(query: string): IntentClassification {
  const lowerQuery = query.toLowerCase().trim();

  // Simple dashboard queries (direct data retrieval)
  const simplePatterns = [
    /^what(?:'s| is) my (cash|balance|revenue|expenses?|profit)/i,
    /^show (?:me )?my (cash|balance|revenue|expenses?|profit)/i,
    /^how much (cash|money|revenue)/i,
    /^current (cash|balance|revenue|expenses?)/i,
    /^total (revenue|expenses?|profit|income)/i,
  ];

  for (const pattern of simplePatterns) {
    if (pattern.test(lowerQuery)) {
      return {
        intent: "SIMPLE_DASHBOARD",
        confidence: 0.95,
        suggestedAction: "dashboard_only",
        requiresLLM: false, // Can be answered with template
      };
    }
  }

  // Conversational queries (needs context)
  const conversationalPatterns = [
    /^(tell me more|explain|why|how come|what do you mean)/i,
    /^(can you|could you) (explain|elaborate|clarify)/i,
    /\b(that|this|it)\b/i, // References to previous context
  ];

  for (const pattern of conversationalPatterns) {
    if (pattern.test(lowerQuery)) {
      return {
        intent: "CONVERSATIONAL",
        confidence: 0.9,
        suggestedAction: "full_context",
        requiresLLM: true,
      };
    }
  }

  // Complex analytical queries
  const complexPatterns = [
    /\b(compare|vs|versus|trend|analyze|forecast|predict)\b/i,
    /\b(last|previous|past) (month|quarter|year|week)\b/i,
    /\b(should i|recommend|advice|suggest)\b/i,
    /\b(optimize|improve|reduce|increase|grow)\b/i,
  ];

  for (const pattern of complexPatterns) {
    if (pattern.test(lowerQuery)) {
      return {
        intent: "COMPLEX",
        confidence: 0.85,
        suggestedAction: "full_context",
        requiresLLM: true,
      };
    }
  }

  // Analytical queries (RAG search needed)
  const analyticalPatterns = [
    /^(what|which|list|show|find) .*(top|biggest|largest|most|expensive)/i,
    /^(where|what) (am i|are we) spending/i,
    /\b(breakdown|summary|overview) of\b/i,
    /^(list|show) (all|my) (transactions|expenses?|categories)/i,
  ];

  for (const pattern of analyticalPatterns) {
    if (pattern.test(lowerQuery)) {
      return {
        intent: "ANALYTICAL",
        confidence: 0.8,
        suggestedAction: "rag_search",
        requiresLLM: true,
      };
    }
  }

  // Default: assume complex
  return {
    intent: "UNKNOWN",
    confidence: 0.5,
    suggestedAction: "full_context",
    requiresLLM: true,
  };
}

/**
 * Fast-path response for simple dashboard queries
 * Returns pre-formatted answer without LLM
 */
export function getSimpleDashboardResponse(
  query: string,
  dashboardData: {
    cash: number;
    revenue: number;
    expenses: number;
    profit: number;
    workingCapital: number;
  }
): string | null {
  const lowerQuery = query.toLowerCase();

  // Cash balance queries
  if (/cash|balance/.test(lowerQuery)) {
    const cash = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(dashboardData.cash);

    const status =
      dashboardData.cash > 0
        ? "looking good"
        : dashboardData.cash < 0
        ? "⚠️ negative - we need to discuss this"
        : "at zero";

    return `Your current cash balance is ${cash}, ${status}. ${
      dashboardData.cash > 10000
        ? "You have a healthy cash position."
        : dashboardData.cash > 0
        ? "Keep an eye on upcoming expenses."
        : "Let's talk about improving cash flow."
    }`;
  }

  // Revenue queries
  if (/revenue|income|sales/.test(lowerQuery)) {
    const revenue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(dashboardData.revenue);

    return `Your revenue this month is ${revenue}. ${
      dashboardData.revenue > dashboardData.expenses
        ? "Great! You're operating at a profit."
        : "This is below your expenses - let's work on increasing it."
    }`;
  }

  // Expense queries
  if (/expense|spending|cost/.test(lowerQuery)) {
    const expenses = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(dashboardData.expenses);

    return `Your expenses this month are ${expenses}. ${
      dashboardData.expenses < dashboardData.revenue
        ? "You're maintaining good cost control."
        : "This exceeds your revenue - we should look at cutting costs."
    }`;
  }

  // Profit queries
  if (/profit|net income/.test(lowerQuery)) {
    const profit = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(dashboardData.profit);

    const margin =
      dashboardData.revenue > 0
        ? ((dashboardData.profit / dashboardData.revenue) * 100).toFixed(1)
        : "0";

    return `Your net income this month is ${profit}, with a ${margin}% profit margin. ${
      dashboardData.profit > 0
        ? "Excellent work! Keep this up."
        : "We need to work on profitability - let's analyze your cost structure."
    }`;
  }

  return null; // Query doesn't match simple patterns
}
