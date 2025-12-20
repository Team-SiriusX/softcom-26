import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

// Types
type GetInvoicesResponse = InferResponseType<typeof client.api.invoices.$get>;
type GetInvoiceResponse = InferResponseType<typeof client.api.invoices[":id"]["$get"]>;
type CreateInvoiceRequest = InferRequestType<typeof client.api.invoices.$post>["json"];
type CreateInvoiceResponse = InferResponseType<typeof client.api.invoices.$post>;
type UpdateInvoiceRequest = InferRequestType<typeof client.api.invoices[":id"]["$patch"]>["json"];
type UpdateInvoiceResponse = InferResponseType<typeof client.api.invoices[":id"]["$patch"]>;

// Get all invoices
export const useGetInvoices = (
  businessId?: string,
  status?: string,
  clientId?: string
) => {
  return useQuery<GetInvoicesResponse, Error>({
    queryKey: ["invoices", businessId, status, clientId],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");

      const response = await client.api.invoices.$get({
        query: {
          businessId,
          ...(status && { status }),
          ...(clientId && { clientId }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Get single invoice
export const useGetInvoice = (id?: string) => {
  return useQuery<GetInvoiceResponse, Error>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) throw new Error("Invoice ID required");

      const response = await client.api.invoices[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoice");
      }

      return await response.json();
    },
    enabled: !!id,
  });
};

// Get invoice statistics
export const useGetInvoiceStats = (businessId?: string) => {
  return useQuery({
    queryKey: ["invoice-stats", businessId],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");

      const response = await client.api.invoices.stats[":businessId"].$get({
        param: { businessId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoice statistics");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Create invoice
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateInvoiceResponse, Error, CreateInvoiceRequest>({
    mutationFn: async (json) => {
      const response = await client.api.invoices.$post({ json });

      if (!response.ok) {
        const error = await response.json();
        throw new Error("error" in error ? error.error : "Failed to create invoice");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Invoice created successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices", variables.businessId] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats", variables.businessId] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Update invoice
export const useUpdateInvoice = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateInvoiceResponse, Error, UpdateInvoiceRequest>({
    mutationFn: async (json) => {
      const response = await client.api.invoices[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error("error" in error ? error.error : "Failed to update invoice");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Invoice updated successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Delete invoice
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api.invoices[":id"].$delete({
        param: { id },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error("error" in error ? error.error : "Failed to delete invoice");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
