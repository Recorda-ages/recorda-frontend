import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

import type { DailyStreakMetric } from "../../types";
import { WidgetCard } from "./WidgetCard";

type DailyStreakCardProps = {
  streak: DailyStreakMetric;
};

export function DailyStreakCard({ streak }: Readonly<DailyStreakCardProps>) {
  const { t } = useTranslation();
  const days = streak.current_streak_days;

  return (
    <WidgetCard testID="daily-streak-card" title={t("memoriesMetrics.widgets.streak.title")}>
      <View style={styles.row}>
        <AppText style={styles.value} testID="daily-streak-value" variant="headline1">
          {String(days)}
        </AppText>
        <AppText style={styles.label} variant="body1">
          {t(streakLabelKey(days))}
        </AppText>
      </View>
      <AppText style={styles.caption} variant="caption">
        {t("memoriesMetrics.widgets.streak.explanation")}
      </AppText>
    </WidgetCard>
  );
}

function streakLabelKey(days: number) {
  if (days === 0) {
    return "memoriesMetrics.widgets.streak.none";
  }

  if (days === 1) {
    return "memoriesMetrics.widgets.streak.daySingular";
  }

  return "memoriesMetrics.widgets.streak.dayPlural";
}

const styles = StyleSheet.create({
  caption: {
    color: colors.neutrals[300]
  },
  label: {
    color: colors.neutrals[200]
  },
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing[2]
  },
  value: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.semiBold,
    fontSize: 48,
    lineHeight: 52
  }
});
