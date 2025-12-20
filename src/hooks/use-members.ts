import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// Types
type SearchUserResponse = InferResponseType<typeof client.api.members.search["$get"], 200>;
type GetMembersResponse = InferResponseType<typeof client.api.members[":businessId"]["$get"], 200>;
type AddMemberRequest = InferRequestType<typeof client.api.members[":businessId"]["$post"]>["json"];
type AddMemberResponse = InferResponseType<typeof client.api.members[":businessId"]["$post"], 200>;
type UpdateMemberRequest = InferRequestType<typeof client.api.members[":businessId"][":memberId"]["$patch"]>["json"];
type UpdateMemberResponse = InferResponseType<typeof client.api.members[":businessId"][":memberId"]["$patch"], 200>;

// Search for user by email
export const useSearchUser = (email: string) => {
  return useQuery<SearchUserResponse, Error>({
    queryKey: ["user-search", email],
    queryFn: async () => {
      const response = await client.api.members.search.$get({
        query: { email },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any)?.error || "User not found");
      }

      return await response.json();
    },
    enabled: !!email && email.includes("@"), // Only search if email looks valid
    retry: false,
  });
};

// Get members of a business
export const useGetMembers = (businessId: string) => {
  return useQuery<GetMembersResponse, Error>({
    queryKey: ["members", businessId],
    queryFn: async () => {
      const response = await client.api.members[":businessId"].$get({
        param: { businessId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      return await response.json();
    },
    enabled: !!businessId,
  });
};

// Add a member to a business
export const useAddMember = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation<AddMemberResponse, Error, AddMemberRequest>({
    mutationFn: async (json) => {
      const response = await client.api.members[":businessId"].$post({
        param: { businessId },
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any)?.error || "Failed to add member");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", businessId] });
    },
  });
};

// Update member role
export const useUpdateMember = (businessId: string, memberId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateMemberResponse, Error, UpdateMemberRequest>({
    mutationFn: async (json) => {
      const response = await client.api.members[":businessId"][":memberId"].$patch({
        param: { businessId, memberId },
        json,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any)?.error || "Failed to update member");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", businessId] });
    },
  });
};

// Remove member from business
export const useRemoveMember = (businessId: string) => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (memberId) => {
      const response = await client.api.members[":businessId"][":memberId"].$delete({
        param: { businessId, memberId },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error((error as any)?.error || "Failed to remove member");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", businessId] });
    },
  });
};
