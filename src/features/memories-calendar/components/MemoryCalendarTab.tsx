import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { Button, ErrorState } from "@/components/ui";
import { spacing } from "@/theme";

import { useMemoryCalendar } from "../hooks/useMemoryCalendar";
import { CalendarEmptyState } from "./CalendarEmptyState";
import { DayMemoriesViewerModal } from "./DayMemoriesViewerModal";
import { MemoryCalendarGrid } from "./MemoryCalendarGrid";

function currentMonth() {
  const today = new Date();
  return { month: today.getMonth() + 1, year: today.getFullYear() };
}

/**
 * The Calendar tab of the signed-in user's profile: the month grid, a skeleton of its days
 * while it loads, and the day viewer for a day with Recordas. The header stays on screen in
 * every state, so another month is always one arrow away.
 */
export function MemoryCalendarTab({
  onCreateRecorda,
  userId
}: Readonly<{ onCreateRecorda?: () => void; userId?: string }>) {
  const { t } = useTranslation();
  const [today] = useState(currentMonth);
  const [visibleMonth, setVisibleMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { month, year } = visibleMonth;
  const calendar = useMemoryCalendar(year, month, userId);
  const isCurrentMonth = year === today.year && month === today.month;

  return (
    <View style={styles.container}>
      <MemoryCalendarGrid
        calendar={calendar.data}
        loading={calendar.isLoading}
        month={month}
        onChangeMonth={(nextYear, nextMonth) =>
          setVisibleMonth({ month: nextMonth, year: nextYear })
        }
        onSelectDay={(day) => {
          if (day.count > 0) setSelectedDate(day.date);
        }}
        selectedDate={selectedDate}
        year={year}
      />
      {calendar.isError ? (
        <View style={styles.container}>
          <ErrorState message={t("memoriesCalendar.tab.loadError")} />
          <Button
            disabled={calendar.isRefetching}
            label={t("memoriesCalendar.tab.retry")}
            onPress={() => void calendar.refetch()}
            variant="secondary"
          />
        </View>
      ) : calendar.data?.total_memories === 0 && isCurrentMonth ? (
        <CalendarEmptyState onCreateRecorda={onCreateRecorda} />
      ) : null}
      {selectedDate ? (
        <DayMemoriesViewerModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          userId={userId}
          visible
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] }
});
