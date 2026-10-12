import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";
import { AdminScreenLayout } from "../components/AdminScreenLayout";
import type { AdminBottomTab } from "../components/AdminBottomNavigation";

type AdminPendingScreenProps = {
  title: string;
  activeTab: AdminBottomTab;
};

export function AdminPendingScreen({ title, activeTab }: Readonly<AdminPendingScreenProps>) {
  const { t } = useTranslation();
  return (
    <AdminScreenLayout activeTab={activeTab} title={title} testID="admin-pending-screen">
      <View style={styles.screen}>
        <AppText style={styles.title}>{t("admin.pending.message")}</AppText>
      </View>
    </AdminScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.neutrals[900],
    flex: 1,
    justifyContent: "center",
    padding: spacing[6]
  },
  title: {
    color: colors.neutrals[100]
  }
});
