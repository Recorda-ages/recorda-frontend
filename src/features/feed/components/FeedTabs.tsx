import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

import type { FeedTab } from "../types";

type FeedTabsProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
  /** Pager position (0 = first tab, 1 = second); the indicators track it while swiping. */
  position?: Animated.Value | Animated.AnimatedInterpolation<number>;
};

// Keep the user-facing label as "Para Você" per the approved Figma. The internal tab id
// remains "geral" to match the domain/issue terminology.
export const FEED_TABS: FeedTab[] = ["geral", "following"];

export function FeedTabs({ activeTab, onChange, position }: FeedTabsProps) {
  const { t } = useTranslation();
  // The screen only switches tabs once the pager settles, so a tapped tab is highlighted
  // here meanwhile; this re-renders just the tab bar, not the feed.
  const [pressedTab, setPressedTab] = useState<FeedTab | null>(null);
  const [previousActiveTab, setPreviousActiveTab] = useState(activeTab);

  if (activeTab !== previousActiveTab) {
    setPreviousActiveTab(activeTab);
    setPressedTab(null);
  }

  const shownTab = pressedTab ?? activeTab;
  const activeIndex = FEED_TABS.indexOf(activeTab);
  const [springPosition] = useState(() => new Animated.Value(activeIndex));

  useEffect(() => {
    if (position) return;
    Animated.spring(springPosition, {
      bounciness: 0,
      speed: 14,
      toValue: activeIndex,
      useNativeDriver: true
    }).start();
  }, [activeIndex, position, springPosition]);

  const progress = position ?? springPosition;

  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {FEED_TABS.map((tab, index) => {
        const isActive = tab === shownTab;
        // 1 when the pager rests on this tab, 0 one page away: the outgoing bar drains
        // while the incoming one fills, and nothing is drawn across the gap between them.
        const fill = progress.interpolate({
          extrapolate: "clamp",
          inputRange: [index - 1, index, index + 1],
          outputRange: [0, 1, 0]
        });

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab}
            onPress={() => {
              // Start the scroll before anything re-renders.
              onChange(tab);
              setPressedTab(tab === activeTab ? null : tab);
            }}
            style={styles.tab}
          >
            <AppText
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              style={[styles.label, isActive ? styles.labelActive : undefined]}
            >
              {t(`feed.tabs.${tab}`)}
            </AppText>
            <View style={styles.track}>
              <Animated.View
                style={[
                  styles.fill,
                  // Anchored on the side facing the neighbouring tab, so the green
                  // visibly flows from one bar into the other.
                  { transformOrigin: index === 0 ? "right" : "left" },
                  { transform: [{ scaleX: fill }] }
                ]}
                testID={`feed-tab-fill-${tab}`}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.primary[500],
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  label: {
    color: colors.neutrals[200],
    fontFamily: fontFamily.primary.semiBold,
    textAlign: "center"
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
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4]
  },
  track: {
    backgroundColor: colors.primary[800],
    borderRadius: 2,
    height: 4,
    overflow: "hidden",
    width: "100%"
  }
});
