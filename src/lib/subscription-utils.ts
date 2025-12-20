/**
 * Subscription helper utilities
 */

import type { SubscriptionTier } from "@/generated/prisma";

export const TIER_LIMITS = {
  FREE: {
    aiQueriesLimit: 0,
    transactionsLimit: 50,
    businessAccountsLimit: 1,
    features: {
      basicAccounting: true,
      analytics: false,
      strategicCFO: false,
      tacticalAdvisor: false,
      predictions7Day: false,
      predictions30Day: false,
      automatedAlerts: false,
      scenarioSimulations: false,
      whatsappIntegration: false,
      apiAccess: false,
    },
  },
  PRO: {
    aiQueriesLimit: 30,
    transactionsLimit: -1, // unlimited
    businessAccountsLimit: 3,
    features: {
      basicAccounting: true,
      analytics: true,
      strategicCFO: true,
      tacticalAdvisor: false,
      predictions7Day: true,
      predictions30Day: false,
      automatedAlerts: true,
      scenarioSimulations: false,
      whatsappIntegration: false,
      apiAccess: false,
    },
  },
  BUSINESS: {
    aiQueriesLimit: 150,
    transactionsLimit: -1, // unlimited
    businessAccountsLimit: -1, // unlimited
    features: {
      basicAccounting: true,
      analytics: true,
      strategicCFO: true,
      tacticalAdvisor: true,
      predictions7Day: true,
      predictions30Day: true,
      automatedAlerts: true,
      scenarioSimulations: true,
      whatsappIntegration: true,
      apiAccess: true,
    },
  },
} as const;

export function getTierLimits(tier: SubscriptionTier) {
  return TIER_LIMITS[tier];
}

export function canAccessFeature(tier: SubscriptionTier, feature: keyof typeof TIER_LIMITS.FREE.features) {
  return TIER_LIMITS[tier].features[feature];
}

export function formatUsage(used: number, limit: number) {
  if (limit === -1) return "Unlimited";
  return `${used} / ${limit}`;
}

export function getUsagePercentage(used: number, limit: number) {
  if (limit === -1) return 0;
  return Math.round((used / limit) * 100);
}

export function isNearLimit(used: number, limit: number, threshold: number = 0.8) {
  if (limit === -1) return false;
  return used / limit >= threshold;
}
