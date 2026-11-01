import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

/** Stands in for the tab content while the viewer can't see this profile's content. */
export function ProfilePrivateNotice() {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID="profile-private-notice">
      <Icon
        color={colors.neutrals[500]}
        size={40}
        source="lock-outline"
        testID="profile-private-notice-icon"
      />
      <AppText style={styles.title}>{t("profile.private.title")}</AppText>
      <AppText style={styles.message}>{t("profile.private.message")}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8]
  },
  message: {
    color: colors.neutrals[100],
    textAlign: "center"
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    marginTop: spacing[2],
    textAlign: "center"
  }
});
