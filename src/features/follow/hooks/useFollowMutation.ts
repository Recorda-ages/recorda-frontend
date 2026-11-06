import { getSessionGeneration } from "@/services/api/sessionLifecycle";
import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { profileQueryKey } from "@/features/profile/queryKeys";
import type { ProfileRead } from "@/features/profile/types";

import { USER_SUGGESTIONS_QUERY_KEY } from "../queryKeys";
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
      if (context?.generation !== getSessionGeneration()) return;
      context?.snapshot.forEach(([queryKey, data]) => {
        restoreCachedUser(queryClient, queryKey, data, _input.userId);
      });
      const restricted = context.restrictedProfile;
      // Rolls back only if nothing newer reached the profile meanwhile (e.g. a refetch that
      // already reflects the unfollow): an old snapshot must not reopen the content.
      if (
        restricted &&
        queryClient.getQueryState(profileQueryKey(_input.userId))?.dataUpdateCount ===
          restricted.updateCount
      ) {
        queryClient.setQueryData(profileQueryKey(_input.userId), restricted.previous);
      }
    },

    onMutate: async ({ action, userId }: FollowMutationInput) => {
      const generation = getSessionGeneration();
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_PREFIX });
      if (action === "unfollow") {
        await queryClient.cancelQueries({ exact: true, queryKey: profileQueryKey(userId) });
      }
      if (generation !== getSessionGeneration()) throw new Error("Session ended");
      const snapshot = queryClient.getQueriesData({ queryKey: USERS_QUERY_PREFIX });
      // Read now, in the session that started the mutation.
      const myUserId = queryClient.getQueryData<CurrentUser>(AUTH_ME_QUERY_KEY)?.user_id;

      patchCachedUser(queryClient, userId, action === "follow" ? "seguindo" : "nenhuma");
      const restrictedProfile =
        action === "unfollow" ? restrictPrivateProfile(queryClient, userId) : undefined;

      return { generation, myUserId, restrictedProfile, snapshot };
    },

    onSettled: (_result, _error, { action, userId }: FollowMutationInput, context) => {
      if (context?.generation !== getSessionGeneration()) return;
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_PREFIX });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // The profile screen reads follow_status, counts and can_view_content from the server.
      // Exact: following doesn't change the Recordas grid, and refetching it here could ask
      // for content the viewer just lost access to; it reloads when access is granted.
      void queryClient.invalidateQueries({ exact: true, queryKey: profileQueryKey(userId) });
      // Suggestions skip followed profiles, so an unfollow can bring one back. Follows
      // don't refresh them: the just-followed profile stays visible with its check mark.
      if (action === "unfollow") {
        void queryClient.invalidateQueries({ queryKey: USER_SUGGESTIONS_QUERY_KEY });
      }
    },

    onSuccess: (result: FollowMutationResult | null, input: FollowMutationInput, context) => {
      if (context?.generation !== getSessionGeneration()) return;
      if (result?.follow_status) {
        patchCachedUser(queryClient, input.userId, result.follow_status);
      }
      // The own "Seguindo" counter only counts accepted follows (backend rule).
      const { myUserId } = context;
      if (myUserId && myUserId !== input.userId && changesOwnFollowing(input, result)) {
        void queryClient.invalidateQueries({ exact: true, queryKey: profileQueryKey(myUserId) });
      }
    }
  });
}

/**
 * Whether the signed-in user's following count changed: following a public account
 * ("seguindo") or unfollowing one that was accepted. Following a private account only sends
 * a request, and cancelling it doesn't change the count either. Unknown cases count as a
 * change, so the counter is never left stale.
 */
function changesOwnFollowing(input: FollowMutationInput, result: FollowMutationResult | null) {
  if (input.action === "follow") return result?.follow_status !== "solicitado";
  return input.previousStatus !== "solicitado";
}

/**
 * Unfollowing a private account the viewer could see removes their access. The cached
 * profile is marked restricted at once, so its Recordas leave the screen without waiting
 * for the refetch. Returns the previous profile and the cache's update count right after the
 * restriction, so the rollback can tell whether newer data arrived in between.
 */
function restrictPrivateProfile(queryClient: QueryClient, userId: string) {
  const profile = queryClient.getQueryData<ProfileRead>(profileQueryKey(userId));
  if (!profile?.is_private || !profile.can_view_content) return undefined;

  queryClient.setQueryData<ProfileRead>(profileQueryKey(userId), {
    ...profile,
    can_view_content: false,
    counts: null
  });
  const updateCount = queryClient.getQueryState(profileQueryKey(userId))?.dataUpdateCount;
  return { previous: profile, updateCount };
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

function restoreCachedUser(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  snapshot: unknown,
  userId: string
) {
  if (!Array.isArray(snapshot)) {
    return;
  }

  const previousUser = snapshot.find((item) => isFollowableUser(item) && item.user_id === userId);

  if (!previousUser) {
    return;
  }

  queryClient.setQueryData(queryKey, (current: unknown) => {
    if (!Array.isArray(current)) {
      return current;
    }

    return current.map((item) =>
      isFollowableUser(item) && item.user_id === userId ? previousUser : item
    );
  });
}

function isFollowableUser(item: unknown): item is FollowableUser {
  return typeof item === "object" && item !== null && "user_id" in item && "follow_status" in item;
}
