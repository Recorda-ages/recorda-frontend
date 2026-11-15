import { useMutation } from "@tanstack/react-query";

import { requestPasswordRecovery } from "@/features/auth/api/passwordRecovery";

export function usePasswordRecoveryMutation() {
  return useMutation({
    mutationFn: requestPasswordRecovery
  });
}
