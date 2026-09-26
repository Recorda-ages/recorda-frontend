import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

type RecordaViewHeaderProps = {
  onBack: () => void;
};

export function RecordaViewHeader({ onBack }: Readonly<RecordaViewHeaderProps>) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel={t("recordaView.back")}
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.backButton}
      >
        <Icon color={colors.neutrals[100]} size={36} source="chevron-left" />
      </Pressable>
      <AppText style={styles.logo}>{t("feed.logo")}</AppText>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={t("feed.notifications")}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Icon color={colors.primary[500]} size={30} source="bell-outline" />
        </Pressable>
        <Pressable accessibilityLabel={t("feed.search")} accessibilityRole="button" hitSlop={8}>
          <Icon color={colors.primary[500]} size={30} source="magnify" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[4],
    justifyContent: "flex-end",
    width: 96
  },
  backButton: {
    width: 48
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: spacing[4]
  },
  logo: {
    color: colors.primary[500],
    fontFamily: fontFamily.display.boldItalic,
    fontSize: 28
  }
});
