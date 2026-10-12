import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

import { AdminScreenLayout } from "../components/AdminScreenLayout";

const entries = [
  { key: "reports", route: "AdminReports", icon: "flag-outline" },
  { key: "users", route: "AdminUsers", icon: "account-multiple-outline" },
  { key: "auditLog", route: "AdminAuditLog", icon: "clipboard-text-clock-outline" }
] as const;

export function AdminHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <AdminScreenLayout activeTab="home" title={t("admin.title")} testID="admin-home-screen">
      <ScrollView contentContainerStyle={styles.entries}>
        {entries.map(({ key, route, icon }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={t(`admin.navigation.${key}`)}
            onPress={() => navigation.navigate(route)}
            style={styles.entry}
          >
            <Icon source={icon} size={28} color={colors.primary[500]} />
            <AppText style={styles.label}>{t(`admin.navigation.${key}`)}</AppText>
            <Icon source="chevron-right" size={24} color={colors.neutrals[300]} />
          </Pressable>
        ))}
      </ScrollView>
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  entries: { paddingHorizontal: spacing[4] },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    minHeight: 88,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals[700]
  },
  label: { flex: 1, color: colors.neutrals[100] }
});
