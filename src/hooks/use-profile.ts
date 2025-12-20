import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// Types
type GetProfileResponse = InferResponseType<typeof client.api.profile["$get"], 200>;
type UpdateProfileRequest = InferRequestType<typeof client.api.profile["$patch"]>["json"];
type UpdateProfileResponse = InferResponseType<typeof client.api.profile["$patch"], 200>;

// Get current user profile
export const useGetProfile = () => {
  return useQuery<GetProfileResponse, Error>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await client.api.profile.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      return await response.json();
    },
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: async (json) => {
      const response = await client.api.profile.$patch({ json });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any)?.error || "Failed to update profile");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};
