import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

// Get all ledger accounts
export const useGetLedgerAccounts = (
  businessId?: string,
  filters?: {
    type?: string;
    isActive?: boolean;
  }
) => {
  return useQuery({
    queryKey: ["ledger-accounts", businessId, filters],
    queryFn: async () => {
      if (!businessId) return null;

      const query: any = { businessId, ...filters };
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive.toString();
      }

      const response = await client.api["ledger-accounts"].$get({ query });

      if (!response.ok) {
        throw new Error("Failed to fetch ledger accounts");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!businessId,
  });
};
