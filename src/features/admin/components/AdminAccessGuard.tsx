import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { ADMIN_ROLE, getPostAuthDestination } from "@/features/auth/session";

export function AdminAccessGuard({ children }: PropsWithChildren) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<CurrentUser>(AUTH_ME_QUERY_KEY);
  const hasAdminAccess = currentUser?.role === ADMIN_ROLE;

  useEffect(() => {
    if (hasAdminAccess) {
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: currentUser ? getPostAuthDestination(currentUser) : "Login" }]
    });
  }, [currentUser, hasAdminAccess, navigation]);

  return hasAdminAccess ? children : null;
}
