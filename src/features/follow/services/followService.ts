import { authApiClient } from "@/services/api";

import type { FollowMutationResult } from "../types";

// ponytail: o backend ainda não expõe estas rotas (BE#43 tem branch aberta e
// vazia). Escritas contra o contrato acordado, elas respondem 404 hoje e o
// `useFollowMutation` reverte o estado otimista — o critério "em erro,
// reconciliar estado com o backend" da US20 cobre exatamente esse caso.
export const followService = {
  follow: (userId: string, signal?: AbortSignal) =>
    authApiClient.post<FollowMutationResult>(
      `/users/${encodeURIComponent(userId)}/follow`,
      undefined,
      { signal }
    ),

  unfollow: (userId: string, signal?: AbortSignal) =>
    authApiClient.delete<FollowMutationResult>(`/users/${encodeURIComponent(userId)}/follow`, {
      signal
    })
};
