import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { type PropsWithChildren, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { colors, fontFamily, spacing } from "@/theme";

import { AdminBottomNavigation, type AdminBottomTab } from "./AdminBottomNavigation";

const destinations = {
  home: "Admin",
  reports: "AdminReports",
  users: "AdminUsers",
  auditLog: "AdminAuditLog"
} as const;

type Props = PropsWithChildren<{
  activeTab: AdminBottomTab;
  back?: { label: string; onPress: () => void };
  title: string;
  showBackButton?: boolean;
  showUsername?: boolean;
  testID?: string;
  visibleTabs?: readonly AdminBottomTab[];
}>;

export function AdminScreenLayout({
  activeTab,
  back,
  children,
  showBackButton = activeTab !== "home",
  showUsername = true,
  title,
  testID,
  visibleTabs
}: Readonly<Props>) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useCurrentUser();
  const endSession = useSignOut();
  const logoutStarted = useRef(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    if (logoutStarted.current) return;
    logoutStarted.current = true;
    setSigningOut(true);
    await endSession();
  };

  return (
    <View style={styles.screen} testID={testID}>
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <View style={styles.header}>
          {!showBackButton ? (
            <View style={styles.action} />
          ) : (
            <Pressable
              accessibilityLabel={back?.label ?? t("admin.navigation.home")}
              accessibilityRole="button"
              onPress={back?.onPress ?? (() => navigation.navigate("Admin"))}
              style={styles.action}
            >
              <Icon source="arrow-left" size={24} color={colors.neutrals[100]} />
            </Pressable>
          )}
          <View style={styles.copy}>
            <AppText style={styles.title} variant="headline4">
              {title}
            </AppText>
            {showUsername && user?.username ? (
              <AppText style={styles.username} variant="caption">
                @{user.username}
              </AppText>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel={t("admin.signOut")}
            accessibilityRole="button"
            accessibilityState={{ busy: signingOut, disabled: signingOut }}
            disabled={signingOut}
            onPress={() => void signOut()}
            style={styles.action}
          >
            {signingOut ? (
              <ActivityIndicator color={colors.neutrals[100]} />
            ) : (
              <Icon source="logout" size={26} color={colors.neutrals[100]} />
            )}
          </Pressable>
        </View>
        {children}
      </SafeAreaView>
      <AdminBottomNavigation
        activeTab={activeTab}
        onPress={(tab) => navigation.navigate(destinations[tab])}
        visibleTabs={visibleTabs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutrals[900] },
  content: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    paddingHorizontal: spacing[3]
  },
  action: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, alignItems: "center", paddingVertical: spacing[3] },
  title: { color: colors.neutrals[100], textAlign: "center", fontFamily: fontFamily.primary.bold },
  username: { color: colors.neutrals[300] }
});
