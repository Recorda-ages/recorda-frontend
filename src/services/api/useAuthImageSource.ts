import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { secureStorage } from "@/services/storage";

import { AUTH_TOKEN_KEY } from "./authClient";
import { isApiUrl } from "./client";

export const AUTH_TOKEN_QUERY_KEY = ["auth-token"];

function useAuthToken() {
  const { data } = useQuery({
    queryFn: async () => (await secureStorage.getItem(AUTH_TOKEN_KEY)) ?? null,
    queryKey: AUTH_TOKEN_QUERY_KEY,
    staleTime: Infinity
  });

  return data ?? null;
}

export type AuthImageSource = { headers?: Record<string, string>; uri: string };

/**
 * Media served by the API (recorda photos/videos, avatars) requires the
 * bearer token. A plain `source={uri}` never sends it, so the request comes
 * back 401 and the image just never appears. The token only goes to our own
 * API: any other host would be handed the user's credentials.
 */
export function useAuthImageSource(uri: string | null | undefined): AuthImageSource | undefined {
  const token = useAuthToken();

  // Stable identity matters: screens use the source as an effect dependency.
  return useMemo(() => {
    if (!uri) return undefined;
    return token && isApiUrl(uri)
      ? { headers: { Authorization: `Bearer ${token}` }, uri }
      : { uri };
  }, [token, uri]);
}
