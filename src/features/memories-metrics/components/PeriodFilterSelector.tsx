import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

export const PERIODS = ["last_30_days", "last_90_days", "last_year", "all_time"] as const;
export type MetricsPeriod = (typeof PERIODS)[number];

export function PeriodFilterSelector({
  period,
  onChange
}: Readonly<{ period: MetricsPeriod; onChange: (period: MetricsPeriod) => void }>) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {PERIODS.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: item === period }}
          key={item}
          onPress={() => onChange(item)}
          style={[styles.chip, item === period && styles.selected]}
        >
          <AppText style={styles.text}>{t(`memoriesMetrics.periods.${item}`)}</AppText>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    backgroundColor: colors.neutrals[700],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  selected: { backgroundColor: colors.primary[500] },
  text: { color: colors.neutrals[100] }
});
