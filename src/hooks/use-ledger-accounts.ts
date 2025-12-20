import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType } from "hono";

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

      const response = await client.api["ledger-accounts"]["$get"]({ query });

      if (!response.ok) {
        throw new Error("Failed to fetch ledger accounts");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!businessId,
  });
};

// Create ledger account
type CreateLedgerAccountRequest = InferRequestType<
  (typeof client.api)["ledger-accounts"]["$post"]
>["json"];

export const useCreateLedgerAccount = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateLedgerAccountRequest>({
    mutationFn: async (json) => {
      const response = await client.api["ledger-accounts"]["$post"]({ json });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create ledger account");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-accounts"] });
    },
  });
};

// Update ledger account
type UpdateLedgerAccountRequest = InferRequestType<
  (typeof client.api)["ledger-accounts"][":id"]["$patch"]
>["json"];

export const useUpdateLedgerAccount = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateLedgerAccountRequest>({
    mutationFn: async (json) => {
      const response = await client.api["ledger-accounts"][":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.data.description || "Failed to update ledger account"
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-accounts"] });
    },
  });
};

// Delete ledger account
export const useDeleteLedgerAccount = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api["ledger-accounts"][":id"].$delete({
        param: { id },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete ledger account");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-accounts"] });
    },
  });
};

// Bulk create default chart of accounts
type BulkCreateRequest = InferRequestType<
  (typeof client.api)["ledger-accounts"]["bulk-create-default"]["$post"]
>["json"];

export const useBulkCreateDefaultAccounts = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, BulkCreateRequest>({
    mutationFn: async (json) => {
      const response = await client.api["ledger-accounts"][
        "bulk-create-default"
      ]["$post"]({ json });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create default accounts");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-accounts"] });
    },
  });
};
