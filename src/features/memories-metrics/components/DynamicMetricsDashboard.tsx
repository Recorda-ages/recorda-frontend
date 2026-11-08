import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, ErrorState } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";
import { useUserMetrics } from "../hooks/useUserMetrics";
import { MetricsEmptyState } from "./MetricsEmptyState";
import { type MetricsPeriod, PeriodFilterSelector } from "./PeriodFilterSelector";
import { DailyStreakCard } from "./widgets/DailyStreakCard";
import { TopArtistHighlightCard } from "./widgets/TopArtistHighlightCard";
import { TopGenresRankingCard } from "./widgets/TopGenresRankingCard";

export function DynamicMetricsDashboard({
  onCreateRecorda
}: Readonly<{ onCreateRecorda: () => void }>) {
  const [period, setPeriod] = useState<MetricsPeriod>("last_30_days");
  const metrics = useUserMetrics(period);
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <PeriodFilterSelector period={period} onChange={setPeriod} />
      {metrics.isLoading ? (
        <View
          accessibilityLabel={t("memoriesMetrics.loading")}
          testID="metrics-skeleton"
          style={styles.container}
        >
          <View style={styles.skeleton} />
          <View style={styles.skeleton} />
          <View style={styles.skeleton} />
        </View>
      ) : metrics.isError ? (
        <View style={styles.container}>
          <ErrorState message={metrics.errorMessage ?? t("memoriesMetrics.loadError")} />
          <Button
            label={t("profile.retry")}
            onPress={() => void metrics.refetch()}
            variant="secondary"
          />
        </View>
      ) : metrics.data && !metrics.data.top_artist && metrics.data.top_genres.length === 0 ? (
        <MetricsEmptyState onCreateRecorda={onCreateRecorda} />
      ) : metrics.data ? (
        <View style={styles.container}>
          <TopArtistHighlightCard artist={metrics.data.top_artist} />
          <TopGenresRankingCard genres={metrics.data.top_genres} />
          <DailyStreakCard streak={metrics.data.streak} />
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  skeleton: { backgroundColor: colors.neutrals[700], borderRadius: radius.lg, height: 120 }
});
