import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

export function FeedEmptyState() {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID="feed-empty-state">
      <Icon color={colors.neutrals[500]} size={40} source="account-group-outline" />
      <AppText style={styles.title} variant="headline4">
        {t("feed.emptyState.title")}
      </AppText>
      <AppText style={styles.message}>{t("feed.emptyState.message")}</AppText>
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
