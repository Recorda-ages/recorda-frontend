import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { MonthlyCountMetric } from "../../types";
import { WidgetCard } from "./WidgetCard";

const MAX_MONTHS = 12;
const BAR_AREA_HEIGHT = 96;

type MonthlyDistributionCardProps = {
  months: readonly MonthlyCountMetric[];
};

export function MonthlyDistributionCard({ months }: Readonly<MonthlyDistributionCardProps>) {
  const { i18n, t } = useTranslation();
  const visible = months.slice(-MAX_MONTHS);
  const peak = Math.max(1, ...visible.map((item) => item.count));
  const formatter = new Intl.DateTimeFormat(i18n.language, {
    month: "short",
    timeZone: "UTC",
    year: "2-digit"
  });

  return (
    <WidgetCard
      testID="monthly-distribution-card"
      title={t("memoriesMetrics.widgets.monthly.title")}
    >
      {visible.length > 0 ? (
        <View style={styles.chart}>
          {visible.map((item) => {
            const label = formatter.format(new Date(Date.UTC(item.year, item.month - 1, 1)));

            return (
              <View
                accessibilityLabel={t("memoriesMetrics.widgets.monthly.a11y", {
                  count: item.count,
                  month: label
                })}
                accessible
                key={`${item.year}-${item.month}`}
                style={styles.column}
                testID={`monthly-bar-${item.year}-${item.month}`}
              >
                <AppText style={styles.count} variant="caption">
                  {String(item.count)}
                </AppText>
                <View style={styles.barArea}>
                  <View
                    style={[styles.bar, { height: `${Math.max(6, (item.count / peak) * 100)}%` }]}
                  />
                </View>
                <AppText numberOfLines={1} style={styles.month} variant="caption">
                  {label}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : (
        <AppText style={styles.empty} variant="body2">
          {t("memoriesMetrics.widgets.monthly.empty")}
        </AppText>
      )}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.primary[500],
    borderRadius: radius.sm,
    width: "100%"
  },
  barArea: {
    height: BAR_AREA_HEIGHT,
    justifyContent: "flex-end",
    width: "100%"
  },
  chart: {
    flexDirection: "row",
    gap: spacing[1]
  },
  column: {
    alignItems: "center",
    flex: 1,
    gap: spacing[1],
    minWidth: 0
  },
  count: {
    color: colors.neutrals[200],
    fontFamily: fontFamily.primary.semiBold
  },
  empty: {
    color: colors.neutrals[300]
  },
  month: {
    color: colors.neutrals[300],
    fontSize: 10
  }
});
