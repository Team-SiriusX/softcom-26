/**
 * Stripe Hooks - Client-side hooks for subscription management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferResponseType } from "hono";
import { toast } from "sonner";

type SubscriptionResponse = InferResponseType<typeof client.api.stripe.subscription.$get>;

/**
 * Get current user's subscription details
 */
export const useGetSubscription = () => {
  return useQuery<SubscriptionResponse>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await client.api.stripe.subscription.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }
      return await response.json();
    },
  });
};

/**
 * Create a checkout session for subscription
 */
export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: async ({
      priceId,
      successUrl,
      cancelUrl,
      metadata,
    }: {
      priceId: string;
      successUrl: string;
      cancelUrl: string;
      metadata?: Record<string, string>;
    }) => {
      const response = await client.api.stripe["create-checkout-session"].$post({
        json: {
          priceId,
          mode: "subscription",
          successUrl,
          cancelUrl,
          metadata,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error("Failed to start subscription. Please try again.");
    },
  });
};

/**
 * Create a billing portal session
 */
export const useCreatePortalSession = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await client.api.stripe["create-portal-session"].$post();

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error("Failed to open billing portal. Please try again.");
    },
  });
};

/**
 * Check if user has access to a feature based on their subscription tier
 */
export const useFeatureAccess = () => {
  const { data: subscription } = useGetSubscription();

  return {
    canUseAI: subscription?.tier !== "FREE",
    canUseStrategicCFO: subscription?.tier === "PRO" || subscription?.tier === "BUSINESS",
    canUseTacticalAdvisor: subscription?.tier === "BUSINESS",
    canCreate30DayPredictions: subscription?.tier === "BUSINESS",
    aiQueriesRemaining: subscription
      ? subscription.aiQueriesLimit - subscription.aiQueriesUsed
      : 0,
    hasUnlimitedTransactions: subscription?.transactionsLimit === -1,
    transactionsRemaining: subscription
      ? subscription.transactionsLimit === -1
        ? Infinity
        : subscription.transactionsLimit - subscription.transactionsUsed
      : 0,
    businessAccountsRemaining: subscription
      ? subscription.businessAccountsLimit === -1
        ? Infinity
        : subscription.businessAccountsLimit - subscription.businessAccountsUsed
      : 0,
    subscription,
  };
};
