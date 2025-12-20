/**
 * React Hook for Financial Simulator
 * Provides easy access to "what-if" scenario simulations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import type { InferRequestType, InferResponseType } from "hono";

// Type inference from API
type SimulateRequest = InferRequestType<typeof client.api.simulator.$post>["json"];
type SimulateResponse = InferResponseType<typeof client.api.simulator.$post, 200>;

/**
 * Hook to run a financial simulation
 */
export const useRunSimulation = () => {
  const queryClient = useQueryClient();

  return useMutation<SimulateResponse, Error, SimulateRequest>({
    mutationFn: async (json) => {
      const response = await client.api.simulator.$post({ json });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData as any).error || "Failed to run simulation");
      }
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate history for this business
      queryClient.invalidateQueries({
        queryKey: ["simulator-history", variables.businessId],
      });
    },
  });
};

/**
 * Hook to get simulation history for a business
 */
export const useSimulationHistory = (businessId: string | null) => {
  return useQuery({
    queryKey: ["simulator-history", businessId],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");

      const response = await client.api.simulator.history[":businessId"].$get({
        param: { businessId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch simulation history");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

/**
 * Hook to get a specific simulation
 */
export const useSimulation = (businessId: string | null, simulationId: string | null) => {
  return useQuery({
    queryKey: ["simulation", businessId, simulationId],
    queryFn: async () => {
      if (!businessId || !simulationId) throw new Error("Business ID and Simulation ID required");

      const response = await client.api.simulator[":businessId"][":simulationId"].$get({
        param: { businessId, simulationId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch simulation");
      }

      return await response.json();
    },
    enabled: !!businessId && !!simulationId,
  });
};

/**
 * Hook to clear simulation cache
 */
export const useClearSimulatorCache = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { businessId: string }>({
    mutationFn: async ({ businessId }) => {
      const response = await client.api.simulator.cache[":businessId"].$delete({
        param: { businessId },
      });

      if (!response.ok) {
        throw new Error("Failed to clear cache");
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["simulator-history", variables.businessId],
      });
    },
  });
};
