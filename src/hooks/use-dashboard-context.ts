/**
 * Dashboard Context Hooks
 *
 * Utilities for managing the Redis-cached dashboard snapshot used by the AI agent.
 */

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { useSelectedBusiness } from "@/components/providers/business-provider";

export function useRefreshDashboardContext() {
  const { selectedBusinessId } = useSelectedBusiness();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedBusinessId) throw new Error("No business selected");

      const response = await client.api.agent.dashboard.refresh.$post({
        json: { businessId: selectedBusinessId },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as { error?: string; message?: string }).error ||
            (data as { error?: string; message?: string }).message ||
            "Failed to refresh dashboard context"
        );
      }

      return data as {
        success: boolean;
        data?: { businessId: string; generatedAt: number };
      };
    },
    onSuccess: (result) => {
      if (result?.success) {
        setLastRefreshedAt(new Date());
      }
    },
  });

  const refresh = useCallback(async () => {
    await mutation.mutateAsync();
  }, [mutation]);

  return {
    refresh,
    isRefreshing: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
    lastRefreshedAt,
  };
}
