import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";

// Debug endpoint to check data
export const useGetAnalyticsDebug = (businessId?: string) => {
  return useQuery({
    queryKey: ["analytics", "debug", businessId],
    queryFn: async () => {
      if (!businessId) return null;

      const response = await client.api.analytics.debug.$get({
        query: { businessId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics debug info");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Get analytics overview
export const useGetAnalyticsOverview = (businessId?: string) => {
  return useQuery({
    queryKey: ["analytics", "overview", businessId],
    queryFn: async () => {
      if (!businessId) return null;

      const response = await client.api.analytics.overview.$get({
        query: { businessId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics overview");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Get revenue trends
export const useGetRevenueTrends = (
  businessId?: string,
  months: number = 12
) => {
  return useQuery({
    queryKey: ["analytics", "revenue-trends", businessId, months],
    queryFn: async () => {
      if (!businessId) return null;

      const response = await client.api.analytics["revenue-trends"]["$get"]({
        query: { businessId, months: months.toString() },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch revenue trends");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!businessId,
  });
};

// Get expense breakdown
export const useGetExpenseBreakdown = (
  businessId?: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: [
      "analytics",
      "expense-breakdown",
      businessId,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      if (!businessId || !startDate || !endDate) return null;

      const response = await client.api.analytics["expense-breakdown"]["$get"]({
        query: { businessId, startDate, endDate },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch expense breakdown");
      }

      return await response.json();
    },
    enabled: !!businessId && !!startDate && !!endDate,
  });
};

// Get top expenses
export const useGetTopExpenses = (
  businessId?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 5
) => {
  return useQuery({
    queryKey: [
      "analytics",
      "top-expenses",
      businessId,
      startDate,
      endDate,
      limit,
    ],
    queryFn: async () => {
      if (!businessId || !startDate || !endDate) return null;

      const response = await client.api.analytics["top-expenses"]["$get"]({
        query: {
          businessId,
          startDate,
          endDate,
          limit: limit.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch top expenses");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!businessId && !!startDate && !!endDate,
  });
};

// Get balance sheet
export const useGetBalanceSheet = (businessId?: string, date?: string) => {
  return useQuery({
    queryKey: ["analytics", "balance-sheet", businessId, date],
    queryFn: async () => {
      if (!businessId) return null;

      const query: any = { businessId };
      if (date) query.date = date;

      const response = await client.api.analytics["balance-sheet"]["$get"]({
        query,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch balance sheet");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Get profit & loss statement
export const useGetProfitLoss = (
  businessId?: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ["analytics", "profit-loss", businessId, startDate, endDate],
    queryFn: async () => {
      if (!businessId || !startDate || !endDate) return null;

      const response = await client.api.analytics["profit-loss"]["$get"]({
        query: { businessId, startDate, endDate },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profit & loss");
      }

      return await response.json();
    },
    enabled: !!businessId && !!startDate && !!endDate,
  });
};

// Get cash flow statement
export const useGetCashFlow = (
  businessId?: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ["analytics", "cash-flow", businessId, startDate, endDate],
    queryFn: async () => {
      if (!businessId || !startDate || !endDate) return null;

      const response = await client.api.analytics["cash-flow"]["$get"]({
        query: { businessId, startDate, endDate },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cash flow");
      }

      return await response.json();
    },
    enabled: !!businessId && !!startDate && !!endDate,
  });
};
