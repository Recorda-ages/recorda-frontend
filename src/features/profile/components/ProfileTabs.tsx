import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

export type ProfileTab = "recordas" | "metrics" | "calendar";

type ProfileTabsProps = Readonly<{
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}>;

const TABS: { key: ProfileTab; labelKey: `profile.tabs.${ProfileTab}` }[] = [
  { key: "recordas", labelKey: "profile.tabs.recordas" },
  { key: "metrics", labelKey: "profile.tabs.metrics" },
  { key: "calendar", labelKey: "profile.tabs.calendar" }
];

/**
 * Only the tab bar: the screen decides what goes below each tab, so the own profile (US28)
 * and the third-party one can fill or restrict the content their own way.
 */
export function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  const { t } = useTranslation();

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
            testID={`profile-tab-${tab.key}`}
          >
            <AppText style={[styles.label, isActive && styles.labelActive]} variant="buttonLarge">
              {t(tab.labelKey)}
            </AppText>
            {isActive ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomColor: colors.neutrals[700],
    borderBottomWidth: 1,
    flexDirection: "row"
  },
  indicator: {
    backgroundColor: colors.primary[500],
    bottom: -1,
    height: 3,
    left: 0,
    position: "absolute",
    right: 0
  },
  label: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    paddingBottom: spacing[3],
    textAlign: "center"
  },
  labelActive: {
    color: colors.primary[500]
  },
  tab: {
    alignItems: "center",
    flex: 1,
    paddingTop: spacing[3]
  }
});
