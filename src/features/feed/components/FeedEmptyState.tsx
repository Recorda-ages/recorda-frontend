import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

type FeedEmptyStateProps = Readonly<{
  variant?: "following" | "general";
}>;

export function FeedEmptyState({ variant = "following" }: FeedEmptyStateProps) {
  const { t } = useTranslation();
  const translationKey = variant === "general" ? "feed.generalEmptyState" : "feed.emptyState";

  return (
    <View style={styles.container} testID={`feed-${variant}-empty-state`}>
      <Icon
        color={colors.neutrals[500]}
        size={40}
        source={variant === "general" ? "music-note-outline" : "account-group-outline"}
      />
      <AppText style={styles.title} variant="headline4">
        {t(`${translationKey}.title`)}
      </AppText>
      <AppText style={styles.message}>{t(`${translationKey}.message`)}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[10]
  },
  message: {
    color: colors.neutrals[300],
    textAlign: "center"
  },
  title: {
    color: colors.neutrals[100],
    textAlign: "center"
  }
});
