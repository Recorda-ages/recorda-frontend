import { authApiClient } from "@/services/api";

import type { ProfileRead } from "../types";

/**
 * NÃO CONFIRMADO: o path do perfil de terceiros é da #109, que ainda não o definiu. Este
 * valor é provisório, escolhido por simetria com `GET /users/me/profile`, e é o único
 * ponto a ajustar quando a #109 sair (ver IMPLEMENTATION_NOTES.md, §6.1). Não há fallback
 * para `GET /users/{id}`, que é uma rota administrativa.
 */
const userProfilePath = (userId: string) => `/users/${encodeURIComponent(userId)}/profile`;

export const profileService = {
  getUserProfile: (userId: string, signal?: AbortSignal) =>
    authApiClient.get<ProfileRead>(userProfilePath(userId), { signal })
};
