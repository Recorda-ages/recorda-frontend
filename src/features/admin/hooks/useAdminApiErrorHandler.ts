import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRef } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { clearSession } from "@/features/auth/session";
import { ApiError } from "@/services/api";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function useAdminApiErrorHandler() {
  const navigation = useNavigation<Navigation>();
  const { t } = useTranslation();
  const activeLogout = useRef<Promise<void> | null>(null);

  return async (error: unknown): Promise<boolean> => {
    if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) {
      return false;
    }

    if (activeLogout.current) {
      await activeLogout.current;
      return true;
    }

    const isExpired = error.status === 401;
    Alert.alert(
      t(isExpired ? "admin.session.expiredTitle" : "admin.session.forbiddenTitle"),
      t(isExpired ? "admin.session.expiredMessage" : "admin.session.forbiddenMessage")
    );

    const logout = clearSession()
      .catch(() => undefined)
      .then(() => {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      });
    activeLogout.current = logout;

    try {
      await logout;
    } finally {
      if (activeLogout.current === logout) {
        activeLogout.current = null;
      }
    }

    return true;
  };
}
