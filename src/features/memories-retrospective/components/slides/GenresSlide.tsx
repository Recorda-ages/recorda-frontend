import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { baseColors, colors, radius, spacing, withOpacity } from "@/theme";

import type { RetrospectiveStory } from "../../storyData";
import { SlideFrame, slideStyles } from "./SlideFrame";

/** Slide 3: distribuição dos gêneros, uma barra proporcional por gênero. */
export function GenresSlide({ genres }: Readonly<{ genres: RetrospectiveStory["top_genres"] }>) {
  const { t } = useTranslation();

  return (
    <SlideFrame
      eyebrow={t("retrospective.genres.eyebrow")}
      subtitle={t("retrospective.genres.subtitle")}
      title={t("retrospective.genres.title")}
    >
      {genres.map((genre) => (
        <View key={genre.name} style={styles.item}>
          <View style={styles.labels}>
            <AppText style={slideStyles.white} variant="body1">
              {genre.name}
            </AppText>
            <AppText style={slideStyles.value} variant="buttonSmall">
              {`${genre.percentage}%`}
            </AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${genre.percentage}%` }]} />
          </View>
        </View>
      ))}
    </SlideFrame>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.primary[500],
    height: "100%"
  },
  item: {
    gap: spacing[1]
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  track: {
    backgroundColor: withOpacity(baseColors.white, 0.1),
    borderRadius: radius.full,
    height: 8,
    overflow: "hidden"
  }
});
