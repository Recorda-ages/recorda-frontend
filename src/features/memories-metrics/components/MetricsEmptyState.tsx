import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

export function MetricsEmptyState({ onCreateRecorda }: Readonly<{ onCreateRecorda?: () => void }>) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <AppText style={styles.text}>
        {t(onCreateRecorda ? "memoriesMetrics.empty" : "memoriesMetrics.emptyOther")}
      </AppText>
      {onCreateRecorda ? (
        <Button label={t("memoriesMetrics.create")} onPress={onCreateRecorda} />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing[4], paddingVertical: spacing[6] },
  text: { color: colors.neutrals[200], textAlign: "center" }
});
