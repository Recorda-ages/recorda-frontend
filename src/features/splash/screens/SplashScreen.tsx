import React, { useCallback, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY, getCurrentUser } from "@/features/auth/api/getCurrentUser";
import {
  clearSession,
  getPostAuthDestination,
  type PostAuthDestination
} from "@/features/auth/session";
import { AUTH_TOKEN_KEY } from "@/services/api/authClient";
import { ApiError } from "@/services/api/errors";
import { secureStorage } from "@/services/storage/secureStorage";
import { baseColors, colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Splash">;

type SplashDestination = PostAuthDestination | "Login";

export const SPLASH_TIMEOUT_MS = 3000;

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const hasNavigated = useRef(false);

  const navigateOnce = useCallback(
    (screen: SplashDestination) => {
      if (hasNavigated.current) {
        return;
      }
      hasNavigated.current = true;
      navigation.replace(screen);
    },
    [navigation]
  );

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    let timeoutId: ReturnType<typeof setTimeout>;

    const finish = (screen: SplashDestination) => {
      if (!isActive || hasNavigated.current) {
        return;
      }
      isActive = false;
      clearTimeout(timeoutId);
      controller.abort();
      navigateOnce(screen);
    };

    timeoutId = setTimeout(() => {
      finish("Login");
    }, SPLASH_TIMEOUT_MS);

    async function checkSession() {
      try {
        const token = await secureStorage.getItem(AUTH_TOKEN_KEY);

        if (!token) {
          finish("Login");
          return;
        }

        if (!isActive) {
          return;
        }

        const user = await getCurrentUser(token, controller.signal);

        if (!isActive) {
          return;
        }

        queryClient.setQueryData(AUTH_ME_QUERY_KEY, user);
        finish(getPostAuthDestination(user));
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          await clearSession();
        }

        finish("Login");
      }
    }

    void checkSession();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [navigateOnce]);

  return (
    <View testID="splash-screen-container" style={styles.container}>
      <StatusBar style="light" />
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={require("@/assets/images/glow.png")}
        style={styles.radialGlowTop}
      />
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={require("@/assets/images/glow.png")}
        style={styles.radialGlowBottom}
      />
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
    top: -190,
    left: -210,
    width: 520,
    height: 520,
    opacity: 0.48,
    pointerEvents: "none"
  },
  radialGlowBottom: {
    position: "absolute",
    bottom: -190,
    right: -210,
    width: 520,
    height: 520,
    opacity: 0.42,
    pointerEvents: "none",
    transform: [{ rotate: "180deg" }]
  },
  logoText: {
    color: colors.primary[500],
    fontSize: 54,
    fontFamily: fontFamily.primary.bold,
    fontStyle: "italic",
    letterSpacing: 0
  }
});
