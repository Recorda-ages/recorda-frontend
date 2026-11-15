import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

import { formatMonthName } from "../utils/calendarMonth";

type CalendarHeaderProps = Readonly<{
  activeDays?: number;
  month: number;
  onNext: () => void;
  onPrevious: () => void;
  totalMemories?: number;
  year: number;
}>;

export function CalendarHeader({
  activeDays = 0,
  month,
  onNext,
  onPrevious,
  totalMemories,
  year
}: CalendarHeaderProps) {
  const { i18n, t } = useTranslation();
  const title = t("memoriesCalendar.grid.monthTitle", {
    month: formatMonthName(year, month, i18n.language),
    year
  });

  let summary: string | null = null;
  if (totalMemories === 0) {
    summary = t("memoriesCalendar.grid.summaryEmpty");
  } else if (totalMemories !== undefined) {
    summary = t("memoriesCalendar.grid.summary", {
      days: t("memoriesCalendar.grid.days", { count: activeDays }),
      memories: t("memoriesCalendar.grid.memories", { count: totalMemories })
    });
  }

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <AppText accessibilityRole="header" style={styles.title} testID="calendar-month-title">
          {title}
        </AppText>
        {summary ? (
          <AppText style={styles.summary} testID="calendar-month-summary">
            {summary}
          </AppText>
        ) : null}
      </View>
      <View style={styles.arrows}>
        <Pressable
          accessibilityLabel={t("memoriesCalendar.grid.previousMonth")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPrevious}
          style={({ pressed }) => [styles.arrow, pressed ? styles.arrowPressed : null]}
          testID="calendar-previous-month"
        >
          <Icon color={colors.neutrals[100]} size={24} source="chevron-left" />
        </Pressable>
        <Pressable
          accessibilityLabel={t("memoriesCalendar.grid.nextMonth")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onNext}
          style={({ pressed }) => [styles.arrow, pressed ? styles.arrowPressed : null]}
          testID="calendar-next-month"
        >
          <Icon color={colors.neutrals[100]} size={24} source="chevron-right" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  arrowPressed: {
    opacity: 0.6
  },
  arrows: {
    flexDirection: "row",
    gap: spacing[1]
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  summary: {
    color: colors.neutrals[300],
    fontFamily: fontFamily.primary.regular,
    fontSize: 12,
    marginTop: 2
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 18
  },
  titleBlock: {
    flex: 1,
    paddingRight: spacing[2]
  }
});
