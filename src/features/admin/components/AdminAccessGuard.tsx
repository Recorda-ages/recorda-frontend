import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { ADMIN_ROLE, getPostAuthDestination } from "@/features/auth/session";

export function AdminAccessGuard({ children }: PropsWithChildren) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUser = useCurrentUser();
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
