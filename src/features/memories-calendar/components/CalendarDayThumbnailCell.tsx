import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { baseColors, colors, fontFamily, withOpacity } from "@/theme";

import type { CalendarDaySummary } from "../types";

type CalendarDayThumbnailCellProps = Readonly<{
  accessibilityDate: string;
  date: string;
  day: number;
  onSelect?: (summary: CalendarDaySummary) => void;
  selected?: boolean;
  summary?: CalendarDaySummary;
}>;

const CELL_RADIUS = 10;
const SCRIM = [
  withOpacity(baseColors.black, 0.45),
  withOpacity(baseColors.black, 0.2),
  withOpacity(baseColors.black, 0.45)
] as const;

function CalendarDayThumbnailCellComponent({
  accessibilityDate,
  date,
  day,
  onSelect,
  selected = false,
  summary
}: CalendarDayThumbnailCellProps) {
  if (!summary) {
    return (
      <View style={styles.cell} testID={`calendar-day-${date}`}>
        <View style={[styles.frame, styles.inactive]}>
          <AppText style={styles.inactiveNumber}>{day}</AppText>
        </View>
      </View>
    );
  }

  return (
    <ActiveDayCell
      accessibilityDate={accessibilityDate}
      day={day}
      onSelect={onSelect}
      selected={selected}
      summary={summary}
    />
  );
}

type ActiveDayCellProps = Readonly<{
  accessibilityDate: string;
  day: number;
  onSelect?: (summary: CalendarDaySummary) => void;
  selected: boolean;
  summary: CalendarDaySummary;
}>;

function ActiveDayCell({
  accessibilityDate,
  day,
  onSelect,
  selected,
  summary
}: ActiveDayCellProps) {
  const { t } = useTranslation();
  const source = useAuthImageSource(resolveApiAssetUrl(summary.thumbnail_url));
  const extra = summary.count - 1;

  return (
    <Pressable
      accessibilityLabel={t("memoriesCalendar.grid.dayLabel", {
        count: summary.count,
        date: accessibilityDate
      })}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect?.(summary)}
      style={({ pressed }) => [styles.cell, pressed ? styles.pressed : null]}
      testID={`calendar-day-${summary.date}`}
    >
      {({ pressed }) => (
        <>
          <View style={styles.frame}>
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={source}
              style={StyleSheet.absoluteFill}
              testID={`calendar-day-thumbnail-${summary.date}`}
              transition={120}
            />
            <LinearGradient colors={SCRIM} pointerEvents="none" style={StyleSheet.absoluteFill} />
            <AppText style={styles.activeNumber}>{day}</AppText>
            {extra > 0 ? (
              <View style={styles.badge} testID={`calendar-day-badge-${summary.date}`}>
                <AppText style={styles.badgeText}>
                  {t("memoriesCalendar.grid.extraMemories", { extra })}
                </AppText>
              </View>
            ) : null}
          </View>
          {selected || pressed ? (
            <View
              pointerEvents="none"
              style={styles.ring}
              testID={`calendar-day-ring-${summary.date}`}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export const CalendarDayThumbnailCell = memo(CalendarDayThumbnailCellComponent);

const styles = StyleSheet.create({
  activeNumber: {
    color: baseColors.white,
    fontFamily: fontFamily.primary.bold,
    fontSize: 16,
    textShadowColor: withOpacity(baseColors.black, 0.8),
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: 7,
    height: 14,
    justifyContent: "center",
    minWidth: 16,
    paddingHorizontal: 3,
    position: "absolute",
    right: 2,
    top: 2
  },
  badgeText: {
    color: colors.neutrals[900],
    fontFamily: fontFamily.primary.bold,
    fontSize: 8
  },
  cell: {
    aspectRatio: 0.95,
    flex: 1
  },
  frame: {
    alignItems: "center",
    borderColor: withOpacity(baseColors.white, 0.18),
    borderCurve: "continuous",
    borderRadius: CELL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    overflow: "hidden"
  },
  inactive: {
    backgroundColor: colors.neutrals[800],
    borderColor: baseColors.transparent
  },
  inactiveNumber: {
    color: colors.neutrals[500],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 14
  },
  pressed: {
    transform: [{ scale: 0.95 }]
  },
  ring: {
    borderColor: colors.primary[500],
    borderCurve: "continuous",
    borderRadius: CELL_RADIUS,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    shadowColor: colors.primary[500],
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    top: 0
  }
});
