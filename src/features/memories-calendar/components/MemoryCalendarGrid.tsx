import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PanResponder, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

import type { CalendarDaySummary, MonthlyCalendarResponse } from "../types";
import {
  buildCalendarWeeks,
  createDayFormatter,
  getWeekdayLabels,
  shiftMonth
} from "../utils/calendarMonth";
import { CalendarDayThumbnailCell } from "./CalendarDayThumbnailCell";
import { CalendarHeader } from "./CalendarHeader";

type MemoryCalendarGridProps = Readonly<{
  calendar?: MonthlyCalendarResponse;
  month: number;
  onChangeMonth: (year: number, month: number) => void;
  onSelectDay?: (day: CalendarDaySummary) => void;
  selectedDate?: string | null;
  year: number;
}>;

const CELL_GAP = 6;
const SWIPE_DISTANCE = 48;
const SWIPE_SLOP = 12;

function useLatest<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

function useMonthSwipe(onSwipe: (delta: number) => void) {
  const latest = useLatest(onSwipe);

  return useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > SWIPE_SLOP && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) >= SWIPE_DISTANCE) {
            latest.current(gesture.dx < 0 ? 1 : -1);
          }
        },
        onPanResponderTerminationRequest: () => true
      }).panHandlers,
    [latest]
  );
}

export function MemoryCalendarGrid({
  calendar,
  month,
  onChangeMonth,
  onSelectDay,
  selectedDate = null,
  year
}: MemoryCalendarGridProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month]);
  const weekdays = useMemo(() => getWeekdayLabels(locale), [locale]);
  const formatDay = useMemo(() => createDayFormatter(locale), [locale]);
  const monthData = calendar?.year === year && calendar.month === month ? calendar : undefined;

  const daysByDate = useMemo(
    () => new Map((monthData?.days ?? []).map((summary) => [summary.date, summary])),
    [monthData]
  );

  const latestSelect = useLatest(onSelectDay);
  const selectDay = useCallback(
    (summary: CalendarDaySummary) => latestSelect.current?.(summary),
    [latestSelect]
  );

  const changeMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    onChangeMonth(next.year, next.month);
  };
  const swipeHandlers = useMonthSwipe(changeMonth);

  return (
    <View style={styles.container} testID="memory-calendar-grid">
      <CalendarHeader
        activeDays={monthData?.active_days_count}
        month={month}
        onNext={() => changeMonth(1)}
        onPrevious={() => changeMonth(-1)}
        totalMemories={monthData?.total_memories}
        year={year}
      />

      <View {...swipeHandlers} style={styles.days} testID="memory-calendar-days">
        <View style={styles.row}>
          {weekdays.map((weekday) => (
            <AppText
              accessibilityLabel={weekday.long}
              key={weekday.long}
              style={styles.weekday}
              testID="calendar-weekday"
            >
              {weekday.short}
            </AppText>
          ))}
        </View>

        {weeks.map((week) => (
          <View key={week.id} style={styles.row} testID="calendar-week">
            {week.slots.map((slot) =>
              slot.kind === "day" ? (
                <CalendarDayThumbnailCell
                  accessibilityDate={formatDay(year, month, slot.day)}
                  date={slot.date}
                  day={slot.day}
                  key={slot.id}
                  onSelect={selectDay}
                  selected={slot.date === selectedDate}
                  summary={daysByDate.get(slot.date)}
                />
              ) : (
                <View key={slot.id} style={styles.blank} testID="calendar-blank-day" />
              )
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blank: {
    aspectRatio: 0.95,
    flex: 1
  },
  container: {
    borderColor: withOpacity(colors.primary[500], 0.6),
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing[4],
    padding: spacing[4]
  },
  days: {
    gap: CELL_GAP
  },
  row: {
    flexDirection: "row",
    gap: CELL_GAP
  },
  weekday: {
    color: colors.primary[500],
    flex: 1,
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 13,
    textAlign: "center"
  }
});
