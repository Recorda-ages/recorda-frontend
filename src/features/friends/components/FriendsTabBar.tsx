import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { colors, spacing } from "@/theme";
import { AppText } from "@/components/ui";
import type { FriendsTab } from "../types";

type FriendsTabBarProps = {
  activeTab: FriendsTab;
  onChange: (tab: FriendsTab) => void;
};

const TABS: { key: FriendsTab; labelKey: "friends.followers" | "friends.following" }[] = [
  { key: "seguidores", labelKey: "friends.followers" },
  { key: "seguindo", labelKey: "friends.following" }
];

export function FriendsTabBar({ activeTab, onChange }: Readonly<FriendsTabBarProps>) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <AppText style={styles.label} variant="body1">
              {t(tab.labelKey)}
            </AppText>
            <View
              style={[
                styles.indicator,
                isActive ? styles.indicatorActive : styles.indicatorInactive
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row"
  },
  indicator: {
    bottom: 0,
    height: 4,
    left: 5,
    position: "absolute",
    right: 7
  },
  indicatorActive: {
    backgroundColor: colors.primary[500]
  },
  indicatorInactive: {
    backgroundColor: colors.primary[800]
  },
  label: {
    color: colors.neutrals[100],
    paddingBottom: spacing[3],
    textAlign: "center"
  },
  tab: {
    alignItems: "center",
    flex: 1,
    paddingTop: spacing[3]
  }
});
