import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

// Types
type GetClientsResponse = InferResponseType<typeof client.api.clients.$get>;
type GetClientResponse = InferResponseType<typeof client.api.clients[":id"]["$get"]>;
type CreateClientRequest = InferRequestType<typeof client.api.clients.$post>["json"];
type CreateClientResponse = InferResponseType<typeof client.api.clients.$post>;
type UpdateClientRequest = InferRequestType<typeof client.api.clients[":id"]["$patch"]>["json"];
type UpdateClientResponse = InferResponseType<typeof client.api.clients[":id"]["$patch"]>;

// Get all clients
export const useGetClients = (businessId?: string, isActive?: boolean) => {
  return useQuery<GetClientsResponse, Error>({
    queryKey: ["clients", businessId, isActive],
    queryFn: async () => {
      if (!businessId) throw new Error("Business ID required");
      
      const response = await client.api.clients.$get({
        query: {
          businessId,
          ...(isActive !== undefined && { isActive: String(isActive) }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Get single client
export const useGetClient = (id?: string) => {
  return useQuery<GetClientResponse, Error>({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) throw new Error("Client ID required");

      const response = await client.api.clients[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch client");
      }

      return await response.json();
    },
    enabled: !!id,
  });
};

// Create client
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateClientResponse, Error, CreateClientRequest>({
    mutationFn: async (json) => {
      const response = await client.api.clients.$post({ json });

      if (!response.ok) {
        const error = await response.json();
        throw new Error("error" in error ? error.error : "Failed to create client");
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast.success("Client created successfully");
      queryClient.invalidateQueries({ queryKey: ["clients", variables.businessId] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Update client
export const useUpdateClient = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateClientResponse, Error, UpdateClientRequest>({
    mutationFn: async (json) => {
      const response = await client.api.clients[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error("error" in error ? error.error : "Failed to update client");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Client updated successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", id] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Delete client
export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api.clients[":id"].$delete({
        param: { id },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error("error" in error ? error.error : "Failed to delete client");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Client deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
