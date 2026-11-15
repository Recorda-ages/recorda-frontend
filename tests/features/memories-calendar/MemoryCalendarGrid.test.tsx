import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import type { ComponentProps, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { StyleSheet } from "react-native";
import { PaperProvider } from "react-native-paper";

import { MemoryCalendarGrid } from "@/features/memories-calendar/components/MemoryCalendarGrid";
import { memoryCalendarMock } from "@/features/memories-calendar/mocks/memoryCalendarMock";
import type { MonthlyCalendarResponse } from "@/features/memories-calendar/types";
import { buildCalendarWeeks } from "@/features/memories-calendar/utils/calendarMonth";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api/useAuthImageSource";
import { paperTheme } from "@/theme";

const mockImageMount = jest.fn();

jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");

  function Image(props: { testID?: string }) {
    React.useEffect(() => {
      mockImageMount(props.testID);
    }, [props.testID]);
    return React.createElement(View, props);
  }

  return { Image };
});

type GridProps = ComponentProps<typeof MemoryCalendarGrid>;

const DAY_CELL = /^calendar-day-\d{4}-\d{2}-\d{2}$/;

let october: MonthlyCalendarResponse;
let november: MonthlyCalendarResponse;
let december: MonthlyCalendarResponse;

beforeAll(async () => {
  october = await memoryCalendarMock.getMonthCalendar(2026, 10);
  november = await memoryCalendarMock.getMonthCalendar(2026, 11);
  december = await memoryCalendarMock.getMonthCalendar(2026, 12);
});

beforeEach(() => {
  mockImageMount.mockClear();
});

function Providers({ children, client }: { children: ReactNode; client: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>{children}</PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function renderGrid(props: Partial<GridProps> & Pick<GridProps, "month" | "year">) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);
  const onChangeMonth = jest.fn();
  const onSelectDay = jest.fn();
  const element = (next: Partial<GridProps>) => (
    <Providers client={client}>
      <MemoryCalendarGrid
        onChangeMonth={onChangeMonth}
        onSelectDay={onSelectDay}
        {...props}
        {...next}
      />
    </Providers>
  );
  const view = render(element({}));

  return {
    onChangeMonth,
    onSelectDay,
    rerender: (next: Partial<GridProps>) => view.rerender(element(next))
  };
}

function touch(x: number, previousX: number, timestamp: number, y = 100, previousY = y) {
  return {
    nativeEvent: { changedTouches: [], pageX: x, pageY: y, timestamp, touches: [{}] },
    touchHistory: {
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timestamp,
      numberActiveTouches: 1,
      touchBank: [
        {
          currentPageX: x,
          currentPageY: y,
          currentTimeStamp: timestamp,
          previousPageX: previousX,
          previousPageY: previousY,
          previousTimeStamp: timestamp - 1,
          startPageX: previousX,
          startPageY: previousY,
          startTimeStamp: 0,
          touchActive: true
        }
      ]
    }
  };
}

function swipe(fromX: number, toX: number) {
  const area = screen.getByTestId("memory-calendar-days");
  act(() => {
    area.props.onResponderGrant(touch(fromX, fromX, 1));
    area.props.onResponderMove(touch(toX, fromX, 2));
    area.props.onResponderRelease(touch(toX, toX, 3));
  });
}

describe("MemoryCalendarGrid", () => {
  it.each([
    { days: 28, month: 2, offset: 0, weeks: 4, year: 2026 },
    { days: 29, month: 2, offset: 2, weeks: 5, year: 2028 },
    { days: 30, month: 4, offset: 3, weeks: 5, year: 2026 },
    { days: 30, month: 11, offset: 0, weeks: 5, year: 2026 },
    { days: 31, month: 10, offset: 4, weeks: 5, year: 2026 },
    { days: 31, month: 8, offset: 6, weeks: 6, year: 2026 }
  ])(
    "lays out $month/$year ($days days) in weeks of seven starting on the right weekday",
    ({ days, month, offset, weeks, year }) => {
      renderGrid({ month, year });

      const rows = screen.getAllByTestId("calendar-week");
      expect(rows).toHaveLength(weeks);
      rows.forEach((row) => {
        const cells = within(row).queryAllByTestId(DAY_CELL).length;
        const blanks = within(row).queryAllByTestId("calendar-blank-day").length;
        expect(cells + blanks).toBe(7);
      });

      expect(within(rows[0]).queryAllByTestId("calendar-blank-day")).toHaveLength(offset);
      expect(screen.getAllByTestId(DAY_CELL)).toHaveLength(days);

      const pad = String(month).padStart(2, "0");
      expect(within(rows[0]).getByTestId(`calendar-day-${year}-${pad}-01`)).toBeTruthy();
      expect(
        within(rows[weeks - 1]).getByTestId(`calendar-day-${year}-${pad}-${days}`)
      ).toBeTruthy();
      expect(screen.queryByTestId(`calendar-day-${year}-${pad}-${days + 1}`)).toBeNull();
    }
  );

  it("keeps the cells proportional so the seven columns share the width", () => {
    renderGrid({ calendar: october, month: 10, year: 2026 });

    const cells = [
      screen.getByTestId("calendar-day-2026-10-01"),
      screen.getByTestId("calendar-day-2026-10-02"),
      ...screen.getAllByTestId("calendar-blank-day")
    ];
    cells.forEach((cell) => {
      expect(StyleSheet.flatten(cell.props.style)).toEqual(
        expect.objectContaining({ aspectRatio: 0.95, flex: 1 })
      );
    });
  });

  it("names the columns from Sunday to Saturday", () => {
    renderGrid({ month: 10, year: 2026 });

    const weekdays = screen.getAllByTestId("calendar-weekday");
    expect(weekdays.map((weekday) => weekday.props.children)).toEqual([
      "D",
      "S",
      "T",
      "Q",
      "Q",
      "S",
      "S"
    ]);
    expect(weekdays[0].props.accessibilityLabel).toBe("domingo");
    expect(weekdays[6].props.accessibilityLabel).toBe("sábado");
  });

  it("uses the song cover as the thumbnail of days that start with a video", () => {
    const video = {
      ...october,
      days: [
        {
          ...october.days[2],
          media_type: "VIDEO" as const,
          song_cover_url: "https://cdn.example.com/cover.jpg",
          thumbnail_url: "https://cdn.example.com/clip.mp4"
        }
      ]
    };
    renderGrid({ calendar: video, month: 10, year: 2026 });

    const thumbnail = screen.getByTestId("calendar-day-thumbnail-2026-10-12");
    expect(thumbnail.props.source).toEqual({ uri: "https://cdn.example.com/cover.jpg" });
  });

  it("fills days with memories with the thumbnail and a readable day number", () => {
    renderGrid({ calendar: october, month: 10, year: 2026 });

    const thumbnail = screen.getByTestId("calendar-day-thumbnail-2026-10-03");
    expect(thumbnail.props.source).toEqual({ uri: october.days[1].thumbnail_url });
    expect(thumbnail.props.cachePolicy).toBe("memory-disk");

    const number = within(screen.getByTestId("calendar-day-2026-10-12")).getByText("12");
    expect(StyleSheet.flatten(number.props.style)).toEqual(
      expect.objectContaining({ textShadowRadius: expect.any(Number) })
    );
    expect(StyleSheet.flatten(number.props.style).textShadowRadius).toBeGreaterThan(0);

    const inactive = screen.getByTestId("calendar-day-2026-10-02");
    expect(within(inactive).getByText("2")).toBeTruthy();
    expect(screen.queryByTestId("calendar-day-thumbnail-2026-10-02")).toBeNull();
  });

  it("shows the extra-memories badge only on days with two or more memories", () => {
    renderGrid({ calendar: october, month: 10, year: 2026 });

    expect(screen.getByTestId("calendar-day-badge-2026-10-01")).toHaveTextContent("+1");
    expect(screen.getByTestId("calendar-day-badge-2026-10-03")).toHaveTextContent("+2");
    expect(screen.queryByTestId("calendar-day-badge-2026-10-12")).toBeNull();
    expect(screen.queryByTestId("calendar-day-badge-2026-10-02")).toBeNull();
    expect(screen.getAllByTestId(/^calendar-day-badge-/)).toHaveLength(4);
  });

  it("shows the month, year and how many memories it has", () => {
    renderGrid({ calendar: october, month: 10, year: 2026 });

    expect(screen.getByTestId("calendar-month-title")).toHaveTextContent("Outubro 2026");
    expect(screen.getByTestId("calendar-month-summary")).toHaveTextContent("11 memórias em 5 dias");
  });

  it("says when a month has no memories and keeps every day dark", () => {
    renderGrid({ calendar: december, month: 12, year: 2026 });

    expect(screen.getByTestId("calendar-month-summary")).toHaveTextContent(
      "Nenhuma memória neste mês"
    );
    expect(screen.queryAllByTestId(/^calendar-day-thumbnail-/)).toHaveLength(0);
  });

  it("moves between months with the arrows, across the year boundary", () => {
    const { onChangeMonth, rerender } = renderGrid({ month: 1, year: 2027 });

    fireEvent.press(screen.getByRole("button", { name: "Mês anterior" }));
    expect(onChangeMonth).toHaveBeenLastCalledWith(2026, 12);

    rerender({ month: 12, year: 2026 });
    fireEvent.press(screen.getByRole("button", { name: "Próximo mês" }));
    expect(onChangeMonth).toHaveBeenLastCalledWith(2027, 1);
  });

  it("changes the month with a horizontal swipe and ignores short or vertical drags", () => {
    const { onChangeMonth } = renderGrid({ calendar: october, month: 10, year: 2026 });
    const area = screen.getByTestId("memory-calendar-days");

    swipe(300, 120);
    expect(onChangeMonth).toHaveBeenLastCalledWith(2026, 11);

    swipe(80, 260);
    expect(onChangeMonth).toHaveBeenLastCalledWith(2026, 9);

    swipe(200, 180);
    expect(onChangeMonth).toHaveBeenCalledTimes(2);

    area.props.onStartShouldSetResponderCapture(touch(200, 200, 10));
    expect(area.props.onMoveShouldSetResponderCapture(touch(140, 200, 11))).toBe(true);

    area.props.onStartShouldSetResponderCapture(touch(200, 200, 20));
    expect(area.props.onMoveShouldSetResponderCapture(touch(210, 200, 21, 180, 100))).toBe(false);
  });

  it("opens a day with memories and highlights the selected one", () => {
    const { onSelectDay, rerender } = renderGrid({ calendar: october, month: 10, year: 2026 });

    fireEvent.press(screen.getByRole("button", { name: "12 de outubro, 1 memória" }));
    expect(onSelectDay).toHaveBeenCalledWith(october.days[2]);

    fireEvent.press(screen.getByTestId("calendar-day-2026-10-02"));
    expect(onSelectDay).toHaveBeenCalledTimes(1);

    expect(screen.queryAllByTestId(/^calendar-day-ring-/)).toHaveLength(0);
    rerender({ selectedDate: "2026-10-29" });
    expect(screen.getByTestId("calendar-day-ring-2026-10-29")).toBeTruthy();
    expect(screen.queryAllByTestId(/^calendar-day-ring-/)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "29 de outubro, 3 memórias" })).toBeSelected();
  });

  it("swaps the mosaic between months without reloading thumbnails that did not change", () => {
    const { rerender } = renderGrid({ calendar: october, month: 10, year: 2026 });
    expect(mockImageMount).toHaveBeenCalledTimes(5);

    rerender({ calendar: structuredClone(october) });
    expect(mockImageMount).toHaveBeenCalledTimes(5);

    rerender({ month: 11 });
    expect(screen.queryAllByTestId(/^calendar-day-thumbnail-2026-10-/)).toHaveLength(0);
    expect(screen.queryAllByTestId(/^calendar-day-thumbnail-/)).toHaveLength(0);

    rerender({ calendar: november, month: 11 });
    expect(screen.getAllByTestId(/^calendar-day-thumbnail-/)).toHaveLength(1);
    expect(screen.getByTestId("calendar-day-thumbnail-2026-11-02")).toBeTruthy();
    expect(mockImageMount).toHaveBeenCalledTimes(6);
  });

  it("gives every week and empty slot its own id, the same on every render", () => {
    const weeks = buildCalendarWeeks(2026, 8);
    const ids = weeks.flatMap((week) => [week.id, ...week.slots.map((slot) => slot.id)]);

    expect(new Set(ids).size).toBe(ids.length);
    expect(weeks.map((week) => week.id)).toEqual([
      "2026-08-week-1",
      "2026-08-week-2",
      "2026-08-week-3",
      "2026-08-week-4",
      "2026-08-week-5",
      "2026-08-week-6"
    ]);
    expect(weeks[0].slots.slice(0, 2).map((slot) => slot.id)).toEqual([
      "2026-08-before-1",
      "2026-08-before-2"
    ]);
    expect(weeks[5].slots.map((slot) => slot.id)).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-08-after-1",
      "2026-08-after-2",
      "2026-08-after-3",
      "2026-08-after-4",
      "2026-08-after-5"
    ]);
    expect(buildCalendarWeeks(2026, 8)).toEqual(weeks);
  });

  it("follows the app language", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    renderGrid({ calendar: october, month: 10, year: 2026 });

    expect(screen.getByTestId("calendar-month-title")).toHaveTextContent("October 2026");
    expect(screen.getByTestId("calendar-month-summary")).toHaveTextContent(
      "11 memories across 5 days"
    );
    expect(
      screen.getAllByTestId("calendar-weekday").map((weekday) => weekday.props.children)
    ).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
    expect(screen.getByRole("button", { name: "October 12, 1 memory" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next month" })).toBeTruthy();
  });
});
