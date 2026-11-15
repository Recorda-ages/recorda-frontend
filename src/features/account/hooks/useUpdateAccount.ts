import { useMutation, useQueryClient } from "@tanstack/react-query";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";

import { accountAdapter } from "../services/accountAdapter";
import type { AccountChanges } from "../types";
import { useAccountQueryKey } from "./useAccount";

export function useUpdateAccount() {
  const client = useQueryClient();
  const queryKey = useAccountQueryKey();

  return useMutation({
    mutationFn: (changes: AccountChanges) => accountAdapter.updateAccount(changes),
    onSuccess: (account) => {
      client.setQueryData(queryKey, account);
      client.setQueryData<CurrentUser>(AUTH_ME_QUERY_KEY, (user) =>
        user ? { ...user, name: account.name, username: account.username } : user
      );
    }
  });
}
