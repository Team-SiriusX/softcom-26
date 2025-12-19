import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

// Get all categories
export const useGetCategories = (
  businessId?: string,
  filters?: {
    type?: string;
    isActive?: boolean;
  }
) => {
  return useQuery({
    queryKey: ["categories", businessId, filters],
    queryFn: async () => {
      if (!businessId) return null;

      const query: any = { businessId, ...filters };
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive.toString();
      }

      const response = await client.api.categories.$get({ query });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!businessId,
  });
};
