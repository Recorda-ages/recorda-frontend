import { useMutation } from "@tanstack/react-query";

import { accountAdapter } from "../services/accountAdapter";

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => accountAdapter.deleteAccount() });
}
