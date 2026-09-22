import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

import type { FeedTab } from "../types";

type FeedTabsProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
};

const TABS: FeedTab[] = ["geral", "following"];

export function FeedTabs({ activeTab, onChange }: FeedTabsProps) {
  const { t } = useTranslation();

  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {TABS.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab}
            onPress={() => onChange(tab)}
            style={styles.tab}
          >
            <AppText style={[styles.label, isActive ? styles.labelActive : undefined]}>
              {t(`feed.tabs.${tab}`)}
            </AppText>
            <View style={[styles.indicator, isActive ? styles.indicatorActive : undefined]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: colors.primary[800],
    borderRadius: 2,
    height: 4,
    width: "100%"
  },
  indicatorActive: {
    backgroundColor: colors.primary[500]
  },
  label: {
    color: colors.neutrals[200],
    fontFamily: fontFamily.primary.semiBold
  },
  labelActive: {
    color: colors.neutrals[100]
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: spacing[2]
  },
  tabs: {
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3]
  }
});
