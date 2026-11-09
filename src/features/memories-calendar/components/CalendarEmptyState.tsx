import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText, Button } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

/** Shown under the grid when the current month has no Recordas yet. */
export function CalendarEmptyState({ onCreateRecorda }: Readonly<{ onCreateRecorda: () => void }>) {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID="calendar-empty-state">
      <Icon color={colors.primary[500]} size={40} source="calendar-heart" />
      <AppText style={styles.title} variant="headline4">
        {t("memoriesCalendar.tab.emptyTitle")}
      </AppText>
      <AppText style={styles.message}>{t("memoriesCalendar.tab.emptyMessage")}</AppText>
      <Button
        label={t("memoriesCalendar.tab.emptyAction")}
        onPress={onCreateRecorda}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: "stretch", marginTop: spacing[2] },
  container: { alignItems: "center", gap: spacing[3], paddingVertical: spacing[6] },
  message: { color: colors.neutrals[200], textAlign: "center" },
  title: { color: colors.neutrals[100], fontFamily: fontFamily.primary.bold, textAlign: "center" }
});
