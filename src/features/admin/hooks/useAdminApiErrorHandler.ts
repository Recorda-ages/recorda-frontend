import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { useToast } from "@/components/ui/ToastProvider";
import { clearSession } from "@/features/auth/session";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { ApiError } from "@/services/api";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const activeLogouts = new WeakMap<QueryClient, Promise<void>>();

export function useAdminApiErrorHandler() {
  const navigation = useNavigation<Navigation>();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const client = useQueryClient();
  const session = client.getQueryCache().find({ queryKey: AUTH_ME_QUERY_KEY, exact: true });

  return useCallback(
    async (error: unknown): Promise<boolean> => {
      if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) {
        return false;
      }

      const activeLogout = activeLogouts.get(client);
      if (activeLogout) {
        await activeLogout;
        return true;
      }
      // A late failure from an old session must not sign out the next account.
      if (
        !session ||
        client.getQueryCache().find({ queryKey: AUTH_ME_QUERY_KEY, exact: true }) !== session
      )
        return true;

      const isExpired = error.status === 401;
      showToast(
        `${t(isExpired ? "admin.session.expiredTitle" : "admin.session.forbiddenTitle")}. ${t(
          isExpired ? "admin.session.expiredMessage" : "admin.session.forbiddenMessage"
        )}`
      );

      const logout = clearSession()
        .catch(() => undefined)
        .then(() => {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        });
      activeLogouts.set(client, logout);

      try {
        await logout;
      } finally {
        if (activeLogouts.get(client) === logout) {
          activeLogouts.delete(client);
        }
      }

      return true;
    },
    [client, navigation, session, showToast, t]
  );
}
