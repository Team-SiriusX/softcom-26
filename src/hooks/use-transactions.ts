import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// Get all transactions
export const useGetTransactions = (
  businessId?: string,
  filters?: {
    type?: string;
    ledgerAccountId?: string;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    isReconciled?: boolean;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ["transactions", businessId, filters],
    queryFn: async () => {
      if (!businessId) return null;

      const query: any = { businessId, ...filters };
      if (filters?.isReconciled !== undefined) {
        query.isReconciled = filters.isReconciled.toString();
      }
      if (filters?.page) query.page = filters.page.toString();
      if (filters?.limit) query.limit = filters.limit.toString();

      const response = await client.api.transactions.$get({ query });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Get single transaction
export const useGetTransaction = (id?: string) => {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      if (!id) return null;

      const response = await client.api.transactions[":id"]["$get"]({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!id,
  });
};

// Create transaction
type CreateTransactionRequest = InferRequestType<
  typeof client.api.transactions.$post
>["json"];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateTransactionRequest>({
    mutationFn: async (json) => {
      const response = await client.api.transactions.$post({ json });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create transaction");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-accounts"] });
    },
  });
};

// Update transaction
type UpdateTransactionRequest = InferRequestType<
  typeof client.api.transactions[":id"]["$patch"]
>["json"];

export const useUpdateTransaction = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateTransactionRequest>({
    mutationFn: async (json) => {
      const response = await client.api.transactions[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
};

// Delete transaction
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api.transactions[":id"].$delete({
        param: { id },
      });

      if (!response.ok) {
        const error = await response.json();
        const message = error && typeof error === 'object' && 'error' in error 
          ? (error as { error: string }).error 
          : "Failed to delete transaction";
        throw new Error(message);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["ledger-accounts"] });
    },
  });
};

// Reconcile transaction
export const useReconcileTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api.transactions[":id"].reconcile.$post({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to reconcile transaction");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};
