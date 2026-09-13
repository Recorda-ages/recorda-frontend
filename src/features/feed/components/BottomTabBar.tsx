import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

export type BottomTab = "camera" | "feed" | "profile";

type BottomTabBarProps = {
  activeTab: BottomTab;
  onPress: (tab: BottomTab) => void;
};

const TAB_ICONS: Record<BottomTab, string> = {
  camera: "camera-outline",
  feed: "home",
  profile: "account-circle-outline"
};

const TABS: BottomTab[] = ["camera", "feed", "profile"];

export function BottomTabBar({ activeTab, onPress }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}
    >
      {TABS.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <Pressable
            accessibilityLabel={t(`feed.tabBar.${tab}`)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            hitSlop={8}
            key={tab}
            onPress={() => onPress(tab)}
            style={styles.tab}
            testID={`tab-bar-${tab}`}
          >
            <Icon color={colors.primary[500]} size={30} source={TAB_ICONS[tab]} />
            <View style={[styles.dot, isActive ? styles.dotActive : undefined]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.neutrals[800],
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing[3]
  },
  dot: {
    borderRadius: 2,
    height: 4,
    marginTop: spacing[1],
    width: 12
  },
  dotActive: {
    backgroundColor: colors.primary[500]
  },
  tab: {
    alignItems: "center",
    minWidth: 64
  }
});
