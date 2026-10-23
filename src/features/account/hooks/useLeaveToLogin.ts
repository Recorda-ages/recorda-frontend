import { useCallback } from "react";

import { useToast } from "@/components/ui";
import { useSignOut } from "@/features/auth/hooks/useSignOut";

export function useLeaveToLogin() {
  const signOut = useSignOut();
  const { showToast } = useToast();

  return useCallback(
    async (message: string) => {
      await signOut();
      showToast(message);
    },
    [showToast, signOut]
  );
}
