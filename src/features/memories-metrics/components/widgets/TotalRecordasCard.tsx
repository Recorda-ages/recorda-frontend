import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

import { WidgetCard } from "./WidgetCard";

export function TotalRecordasCard({ total }: Readonly<{ total: number }>) {
  const { t } = useTranslation();

  return (
    <WidgetCard testID="total-recordas-card" title={t("memoriesMetrics.widgets.total.title")}>
      <View style={styles.row}>
        <AppText style={styles.value} testID="total-recordas-value" variant="headline1">
          {String(total)}
        </AppText>
        <AppText style={styles.label} variant="body1">
          {t(
            total === 1
              ? "memoriesMetrics.widgets.total.singular"
              : "memoriesMetrics.widgets.total.plural"
          )}
        </AppText>
      </View>
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.neutrals[200]
  },
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: spacing[2]
  },
  value: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.display.semiBold,
    fontSize: 48,
    lineHeight: 52
  }
});
