import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ApiError } from "@/services/api";

import { ACCOUNT_QUERY_KEY } from "../queryKeys";
import { accountAdapter } from "../services/accountAdapter";

export function useAccountQueryKey() {
  const currentUser = useCurrentUser();
  return [...ACCOUNT_QUERY_KEY, currentUser?.user_id ?? null] as const;
}

export function useAccount() {
  const currentUser = useCurrentUser();
  const queryKey = useAccountQueryKey();

  return useQuery({
    enabled: Boolean(currentUser),
    queryFn: ({ signal }) => accountAdapter.getAccount(signal),
    queryKey,
    retry: (failureCount, error) => !isSessionError(error) && failureCount < 1
  });
}

export function isSessionError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}
