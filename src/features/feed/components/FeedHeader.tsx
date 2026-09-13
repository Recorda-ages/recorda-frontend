import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

export function FeedHeader() {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <AppText style={styles.logo}>{t("feed.logo")}</AppText>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={t("feed.notifications")}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Icon color={colors.primary[500]} size={26} source="bell-outline" />
        </Pressable>
        <Pressable accessibilityLabel={t("feed.search")} accessibilityRole="button" hitSlop={8}>
          <Icon color={colors.primary[500]} size={26} source="magnify" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing[4]
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  logo: {
    color: colors.primary[500],
    fontFamily: fontFamily.primary.bold,
    fontSize: 28,
    fontStyle: "italic"
  }
});
