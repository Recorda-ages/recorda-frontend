import { type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

export type ProfileTab = "recordas" | "metrics" | "calendar";

type ProfileTabsProps = Readonly<{
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  /** Content of the Recordas tab. Left out, the tab renders nothing under the bar. */
  recordasContent?: ReactNode;
  /** Content of the Metrics tab. Left out, the tab shows a translated "coming soon". */
  metricsContent?: ReactNode;
  /** Content of the Calendar tab. Left out, the tab shows a translated "coming soon". */
  calendarContent?: ReactNode;
}>;

const SLIDE_DISTANCE = 48;
const SLIDE_DURATION = 260;

const TABS: { key: ProfileTab; labelKey: `profile.tabs.${ProfileTab}` }[] = [
  { key: "recordas", labelKey: "profile.tabs.recordas" },
  { key: "metrics", labelKey: "profile.tabs.metrics" },
  { key: "calendar", labelKey: "profile.tabs.calendar" }
];

/**
 * The tab bar, plus the content of Metrics and Calendar through `metricsContent` and
 * `calendarContent`. The Recordas tab's content (the grid) stays with the screen.
 */
export function ProfileTabs({
  activeTab,
  calendarContent,
  metricsContent,
  onChange,
  recordasContent
}: ProfileTabsProps) {
  const { t } = useTranslation();
  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab);
  const [progress] = useState(() => new Animated.Value(activeIndex));
  const [slide] = useState(() => new Animated.Value(1));
  const [direction] = useState(() => new Animated.Value(1));
  const [offset] = useState(() =>
    Animated.multiply(
      direction,
      slide.interpolate({ inputRange: [0, 1], outputRange: [SLIDE_DISTANCE, 0] })
    )
  );
  const previousIndex = useRef(activeIndex);

  useEffect(() => {
    Animated.spring(progress, {
      bounciness: 0,
      speed: 14,
      toValue: activeIndex,
      useNativeDriver: true
    }).start();
    if (previousIndex.current === activeIndex) return;
    direction.setValue(activeIndex > previousIndex.current ? 1 : -1);
    previousIndex.current = activeIndex;
    slide.setValue(0);
    Animated.timing(slide, {
      duration: SLIDE_DURATION,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [activeIndex, direction, progress, slide]);

  const slot =
    activeTab === "recordas"
      ? recordasContent
      : activeTab === "metrics"
        ? metricsContent
        : calendarContent;

  return (
    <>
      <View accessibilityRole="tablist" style={styles.container}>
        {TABS.map((tab, index) => {
          const isActive = tab.key === activeTab;
          const fill = progress.interpolate({
            extrapolate: "clamp",
            inputRange: [index - 1, index, index + 1],
            outputRange: [0, 1, 0]
          });

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
              <View style={styles.track}>
                <Animated.View
                  style={[
                    styles.fill,
                    { transformOrigin: index === 0 ? "right" : index === 2 ? "left" : "center" },
                    { transform: [{ scaleX: fill }] }
                  ]}
                  testID={`profile-tabfill-${tab.key}`}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
      {activeTab === "recordas" && recordasContent === undefined ? null : (
        <Animated.View
          style={[styles.content, { opacity: slide, transform: [{ translateX: offset }] }]}
        >
          {slot ?? (
            <AppText style={styles.empty} testID={`profile-coming-soon-${activeTab}`}>
              {t("profile.comingSoon")}
            </AppText>
          )}
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing[3]
  },
  content: {
    marginTop: spacing[4]
  },
  empty: {
    color: colors.neutrals[300],
    paddingVertical: spacing[8],
    textAlign: "center"
  },
  fill: {
    backgroundColor: colors.primary[500],
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  label: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    textAlign: "center"
  },
  labelActive: {
    color: colors.primary[500]
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: spacing[2],
    paddingTop: spacing[3]
  },
  track: {
    backgroundColor: colors.primary[800],
    borderRadius: 2,
    height: 4,
    overflow: "hidden",
    width: "100%"
  }
});
