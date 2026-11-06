import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing } from "@/theme";

import type { TopGenreItem } from "../../types";
import { WidgetCard } from "./WidgetCard";

type TopGenresRankingCardProps = {
  genres: readonly TopGenreItem[];
};

export function TopGenresRankingCard({ genres }: Readonly<TopGenresRankingCardProps>) {
  const { t } = useTranslation();
  const ranking = [...genres].sort((a, b) => b.count - a.count);

  return (
    <WidgetCard testID="top-genres-card" title={t("memoriesMetrics.widgets.topGenres.title")}>
      {ranking.length > 0 ? (
        <View style={styles.list}>
          {ranking.map((genre, index) => (
            <GenreRow genre={genre} key={genre.genre_name} position={index + 1} />
          ))}
        </View>
      ) : (
        <AppText style={styles.empty} variant="body2">
          {t("memoriesMetrics.widgets.topGenres.empty")}
        </AppText>
      )}
    </WidgetCard>
  );
}

function GenreRow({ genre, position }: Readonly<{ genre: TopGenreItem; position: number }>) {
  const percentage = clampPercentage(genre.percentage);

  return (
    <View style={styles.row} testID={`top-genre-row-${position}`}>
      <View style={styles.rowHeader}>
        <AppText numberOfLines={1} style={styles.genreName} variant="body2">
          {genre.genre_name}
        </AppText>
        <AppText style={styles.percentage} variant="caption">
          {`${percentage}%`}
        </AppText>
      </View>
      <View
        accessibilityLabel={genre.genre_name}
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 100, min: 0, now: percentage }}
        accessible
        style={styles.track}
      >
        <View
          style={[styles.fill, { width: `${percentage}%` }]}
          testID={`top-genre-fill-${position}`}
        />
      </View>
    </View>
  );
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

const styles = StyleSheet.create({
  empty: {
    color: colors.neutrals[300]
  },
  fill: {
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    height: "100%"
  },
  genreName: {
    color: colors.neutrals[100],
    flexShrink: 1
  },
  list: {
    gap: spacing[3]
  },
  percentage: {
    color: colors.neutrals[300],
    fontFamily: fontFamily.primary.semiBold
  },
  row: {
    gap: spacing[1]
  },
  rowHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "space-between"
  },
  track: {
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.full,
    height: 8,
    overflow: "hidden"
  }
});
