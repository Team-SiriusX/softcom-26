import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

// Get balance sheet
export const useGetBalanceSheet = (businessId?: string, date?: string) => {
  return useQuery({
    queryKey: ["reports", "balance-sheet", businessId, date],
    queryFn: async () => {
      if (!businessId || !date) return null;

      const response = await client.api.reports["balance-sheet"]["$get"]({
        query: { businessId, date },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch balance sheet");
      }

      return await response.json();
    },
    enabled: !!businessId && !!date,
  });
};

// Get profit & loss statement
export const useGetProfitLoss = (
  businessId?: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ["reports", "profit-loss", businessId, startDate, endDate],
    queryFn: async () => {
      if (!businessId || !startDate || !endDate) return null;

      const response = await client.api.reports["profit-loss"]["$get"]({
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
    queryKey: ["reports", "cash-flow", businessId, startDate, endDate],
    queryFn: async () => {
      if (!businessId || !startDate || !endDate) return null;

      const response = await client.api.reports["cash-flow"]["$get"]({
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
