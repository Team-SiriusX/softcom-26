import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// Get all businesses
export const useGetBusinesses = () => {
  return useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const response = await client.api.business.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch businesses");
      }

      const { data } = await response.json();
      return data;
    },
  });
};

// Get single business
export const useGetBusiness = (id?: string) => {
  return useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      if (!id) return null;

      const response = await client.api.business[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch business");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!id,
  });
};

// Create business
type CreateBusinessRequest = InferRequestType<
  typeof client.api.business.$post
>["json"];
type CreateBusinessResponse = InferResponseType<
  typeof client.api.business.$post
>;

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateBusinessResponse, Error, CreateBusinessRequest>({
    mutationFn: async (json) => {
      const response = await client.api.business.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create business");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};

// Update business
type UpdateBusinessRequest = InferRequestType<
  typeof client.api.business[":id"]["$patch"]
>["json"];

export const useUpdateBusiness = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateBusinessRequest>({
    mutationFn: async (json) => {
      const response = await client.api.business[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        throw new Error("Failed to update business");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["business", id] });
    },
  });
};

// Delete business
export const useDeleteBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api.business[":id"].$delete({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to delete business");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
};
