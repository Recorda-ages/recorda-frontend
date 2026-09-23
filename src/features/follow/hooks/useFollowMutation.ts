import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { followService } from "../services/followService";
import type { FollowMutationInput, FollowMutationResult, FollowStatus } from "../types";

/**
 * Prefixo que cobre toda lista de usuários em cache: hoje `["users","search"]`
 * e, quando a US27 chegar, `["users","suggestions"]` — sem alterar este hook.
 */
const USERS_QUERY_PREFIX = ["users"];

type FollowableUser = {
  follow_status: FollowStatus;
  user_id: string;
};

/**
 * Segue / deixa de seguir com atualização otimista (US20).
 *
 * `onMutate` aplica o estado provável na hora, `onError` restaura o snapshot
 * anterior e `onSuccess` sobrescreve com a verdade do servidor — que é o único
 * lugar onde dá para saber se a conta era privada, já que `is_private` não vem
 * no resultado da busca.
 */
export function useFollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, userId }: FollowMutationInput) =>
      action === "follow" ? followService.follow(userId) : followService.unfollow(userId),

    onError: (_error, _input, context) => {
      context?.snapshot.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },

    onMutate: async ({ action, userId }: FollowMutationInput) => {
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_PREFIX });
      const snapshot = queryClient.getQueriesData({ queryKey: USERS_QUERY_PREFIX });

      patchCachedUser(queryClient, userId, action === "follow" ? "seguindo" : "nenhuma");

      return { snapshot };
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_PREFIX });
    },

    onSuccess: (result: FollowMutationResult | null, { userId }: FollowMutationInput) => {
      if (result?.follow_status) {
        patchCachedUser(queryClient, userId, result.follow_status);
      }
    }
  });
}

function patchCachedUser(queryClient: QueryClient, userId: string, status: FollowStatus) {
  queryClient.setQueriesData({ queryKey: USERS_QUERY_PREFIX }, (data: unknown) => {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.map((item) =>
      isFollowableUser(item) && item.user_id === userId ? { ...item, follow_status: status } : item
    );
  });
}

function isFollowableUser(item: unknown): item is FollowableUser {
  return typeof item === "object" && item !== null && "user_id" in item && "follow_status" in item;
}
