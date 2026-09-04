import React, { useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { apiClient } from "@/services/api/client";
import { secureStorage } from "@/services/storage/secureStorage";
import { baseColors, colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Splash">;

type UserResponse = {
  role?: string;
  isAdmin?: boolean;
};

export const AUTH_TOKEN_KEY = "auth_token";
const TIMEOUT_MS = 3000;

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const hasNavigated = useRef(false);

  const navigateOnce = useCallback(
    (screen: keyof RootStackParamList) => {
      if (hasNavigated.current) {
        return;
      }
      hasNavigated.current = true;
      navigation.replace(screen);
    },
    [navigation]
  );

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        navigateOnce("Login");
      }
    }, TIMEOUT_MS);

    async function checkSession() {
      try {
        const token = await secureStorage.getItem(AUTH_TOKEN_KEY);

        if (!token) {
          if (isMounted) {
            navigateOnce("Login");
          }
          return;
        }

        const user = await apiClient.get<UserResponse>("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!isMounted) {
          return;
        }

        const isAdmin = user.role === "admin" || Boolean(user.isAdmin);
        if (isAdmin) {
          navigateOnce("Admin");
        } else {
          navigateOnce("Feed");
        }
      } catch {
        if (!isMounted) {
          return;
        }
        await secureStorage.removeItem(AUTH_TOKEN_KEY);
        navigateOnce("Login");
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [navigateOnce]);

  return (
    <View testID="splash-screen-container" style={styles.container}>
      <View style={styles.radialGlowTop} />
      <View style={styles.radialGlowBottom} />
      <Text style={styles.logoText}>recorda.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.black,
    justifyContent: "center",
    alignItems: "center"
  },
  radialGlowTop: {
    position: "absolute",
    top: -210,
    left: -210,
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: colors.primary[400],
    opacity: 0.38,
    filter: "blur(115px)",
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 115,
    elevation: 20
  },
  radialGlowBottom: {
    position: "absolute",
    bottom: -210,
    right: -210,
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: colors.primary[500],
    opacity: 0.34,
    filter: "blur(115px)",
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 115,
    elevation: 20
  },
  logoText: {
    color: colors.primary[500],
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    fontStyle: "italic",
    letterSpacing: -1.5
  }
});