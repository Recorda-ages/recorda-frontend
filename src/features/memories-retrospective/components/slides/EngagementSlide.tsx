import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { spacing } from "@/theme";

import type { RetrospectiveStory } from "../../storyData";
import { SlideFrame, slideStyles } from "./SlideFrame";

type EngagementSlideProps = Readonly<{
  engagement: RetrospectiveStory["engagement"];
  maxStreak: number;
}>;

/** Slide 5: curtidas e comentários recebidos, mais o maior streak do período. */
export function EngagementSlide({ engagement, maxStreak }: EngagementSlideProps) {
  const { t } = useTranslation();
  const stats = [
    { label: t("retrospective.engagement.likes"), value: String(engagement.likes) },
    { label: t("retrospective.engagement.comments"), value: String(engagement.comments) },
    {
      label: t("retrospective.engagement.streak"),
      value: t("retrospective.engagement.days", { count: maxStreak })
    }
  ];

  return (
    <SlideFrame
      eyebrow={t("retrospective.engagement.eyebrow")}
      subtitle={t("retrospective.engagement.subtitle")}
      title={t("retrospective.engagement.title")}
    >
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[slideStyles.card, styles.stat]}>
            <AppText style={slideStyles.muted} variant="caption">
              {stat.label}
            </AppText>
            <AppText style={slideStyles.value} variant="headline3">
              {stat.value}
            </AppText>
          </View>
        ))}
      </View>
    </SlideFrame>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3]
  },
  stat: {
    flexBasis: "45%",
    flexGrow: 1,
    gap: spacing[1]
  }
});
