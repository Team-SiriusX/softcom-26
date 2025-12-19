import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType } from "hono";

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

// Create category
type CreateCategoryRequest = InferRequestType<
  typeof client.api.categories.$post
>["json"];

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CreateCategoryRequest>({
    mutationFn: async (json) => {
      const response = await client.api.categories.$post({ json });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

// Update category
type UpdateCategoryRequest = InferRequestType<
  typeof client.api.categories[":id"]["$patch"]
>["json"];

export const useUpdateCategory = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateCategoryRequest>({
    mutationFn: async (json) => {
      const response = await client.api.categories[":id"].$patch({
        param: { id },
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

// Delete category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const response = await client.api.categories[":id"].$delete({
        param: { id },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
