import { Pressable, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme";
import { AppText } from "@/components/ui";
import type { FriendsTab } from "../types";

type FriendsTabBarProps = {
  activeTab: FriendsTab;
  onChange: (tab: FriendsTab) => void;
};

const TABS: { key: FriendsTab; label: string }[] = [
  { key: "seguidores", label: "Seguidores" },
  { key: "seguindo", label: "Seguindo" }
];

export function FriendsTabBar({ activeTab, onChange }: FriendsTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab}>
            <AppText style={styles.label} variant="body1">
              {tab.label}
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
