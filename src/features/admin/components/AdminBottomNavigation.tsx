import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

export type AdminBottomTab = "reports" | "users";

type AdminBottomNavigationProps = {
  activeTab: AdminBottomTab;
  onPress: (tab: AdminBottomTab) => void;
};

const tabs: readonly AdminBottomTab[] = ["users", "reports"];
const icons: Record<AdminBottomTab, string> = {
  reports: "flag-outline",
  users: "account-multiple-outline"
};

export function AdminBottomNavigation({ activeTab, onPress }: AdminBottomNavigationProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}
      testID="admin-bottom-navigation"
    >
      {tabs.map((tab) => {
        const selected = tab === activeTab;

        return (
          <Pressable
            accessibilityLabel={t(`admin.navigation.${tab}`)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={8}
            key={tab}
            onPress={() => onPress(tab)}
            style={styles.tab}
          >
            <Icon color={colors.primary[500]} size={28} source={icons[tab]} />
            <View style={[styles.indicator, selected ? styles.indicatorActive : undefined]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.neutrals[800],
    borderTopColor: colors.neutrals[700],
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing[3]
  },
  indicator: {
    borderRadius: 2,
    height: 4,
    marginTop: spacing[1],
    width: 12
  },
  indicatorActive: {
    backgroundColor: colors.primary[500]
  },
  tab: {
    alignItems: "center",
    minWidth: 64
  }
});
