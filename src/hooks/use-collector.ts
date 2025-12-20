/**
 * CollectorAI React Hooks
 * TanStack Query hooks for invoice collection agent
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

// ============================================
// RUN COLLECTOR AI
// ============================================

type RunCollectorRequest = InferRequestType<typeof client.api.collector.run.$post>["json"];
type RunCollectorResponse = InferResponseType<typeof client.api.collector.run.$post>;

export const useRunCollectorAI = () => {
  const queryClient = useQueryClient();

  return useMutation<RunCollectorResponse, Error, RunCollectorRequest>({
    mutationFn: async (json) => {
      const response = await client.api.collector.run.$post({ json });
      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any).error || "Failed to run CollectorAI");
      }
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Type guard: check if response is success or error
      if ("error" in data) {
        toast.error("CollectorAI failed", {
          description: data.error || "Unknown error",
        });
        return;
      }
      
      // Success case
      toast.success("CollectorAI completed successfully!", {
        description: `Processed ${data.stats.processed} invoices, sent ${data.stats.emailsSent} emails`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["collector-history", variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ["collector-invoices", variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ["collector-stats", variables.businessId] });
    },
    onError: (error) => {
      toast.error("Failed to run CollectorAI", {
        description: error.message,
      });
    },
  });
};

// ============================================
// GET EXECUTION HISTORY
// ============================================

export const useCollectorHistory = (businessId?: string) => {
  return useQuery({
    queryKey: ["collector-history", businessId],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");
      
      const response = await client.api.collector.history[":businessId"].$get({
        param: { businessId },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch collector history");
      }
      
      return await response.json();
    },
    enabled: !!businessId,
  });
};

// ============================================
// GET INVOICES NEEDING ATTENTION
// ============================================

export const useCollectorInvoices = (businessId?: string) => {
  return useQuery({
    queryKey: ["collector-invoices", businessId],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");
      
      const response = await client.api.collector.invoices[":businessId"].$get({
        param: { businessId },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch collector invoices");
      }
      
      return await response.json();
    },
    enabled: !!businessId,
  });
};

// ============================================
// GET COLLECTION STATISTICS
// ============================================

export const useCollectorStats = (businessId?: string) => {
  return useQuery({
    queryKey: ["collector-stats", businessId],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");
      
      const response = await client.api.collector.stats[":businessId"].$get({
        param: { businessId },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch collector stats");
      }
      
      return await response.json();
    },
    enabled: !!businessId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// ============================================
// GET COLLECTION ACTIONS
// ============================================

export const useCollectorActions = (businessId?: string, executionId?: string) => {
  return useQuery({
    queryKey: ["collector-actions", businessId, executionId],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");
      
      const url = executionId
        ? `/api/collector/actions/${businessId}?executionId=${executionId}`
        : `/api/collector/actions/${businessId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch collector actions");
      }
      
      return await response.json();
    },
    enabled: !!businessId,
  });
};
