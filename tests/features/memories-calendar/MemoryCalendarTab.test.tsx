import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { MemoryCalendarTab } from "@/features/memories-calendar/components/MemoryCalendarTab";
import { memoryCalendarMock } from "@/features/memories-calendar/mocks/memoryCalendarMock";
import type { MonthlyCalendarResponse } from "@/features/memories-calendar/types";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api/useAuthImageSource";
import { paperTheme } from "@/theme";

const mockGetMonthCalendar = jest.fn();
const mockViewer = jest.fn();

jest.mock("@/features/memories-calendar/services/memoryCalendarService", () => ({
  memoryCalendarService: {
    getMonthCalendar: (...args: unknown[]) => mockGetMonthCalendar(...args),
    getDayMemories: jest.fn()
  }
}));

// The viewer has its own tests; here only what the tab hands to it matters.
jest.mock("@/features/memories-calendar/components/DayMemoriesViewerModal", () => {
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    DayMemoriesViewerModal: (props: { date: string; onClose: () => void; visible: boolean }) => {
      mockViewer(props);
      return React.createElement(
        Pressable,
        { onPress: props.onClose, testID: "viewer-close" },
        React.createElement(Text, { testID: "viewer-date" }, props.date)
      );
    }
  };
});

jest.mock("expo-image", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: View };
});

// October 2026 has Recordas in the mock; December 2026 has none.
const OCTOBER = new Date(2026, 9, 15, 12);
const DECEMBER = new Date(2026, 11, 15, 12);

let october: MonthlyCalendarResponse;

beforeAll(async () => {
  october = await memoryCalendarMock.getMonthCalendar(2026, 10);
});

beforeEach(async () => {
  jest.clearAllMocks();
  mockGetMonthCalendar.mockImplementation(memoryCalendarMock.getMonthCalendar);
  await act(() => i18n.changeLanguage("pt-BR"));
});

afterEach(() => jest.useRealTimers());

/** Fakes only the clock, so "today" is fixed while promises and timers stay real. */
function setToday(date: Date) {
  jest.useFakeTimers({
    doNotFake: [
      "nextTick",
      "setImmediate",
      "clearImmediate",
      "setInterval",
      "clearInterval",
      "setTimeout",
      "clearTimeout",
      "queueMicrotask",
      "hrtime",
      "performance",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "requestIdleCallback",
      "cancelIdleCallback"
    ],
    now: date
  });
}

function renderTab(options: { onCreateRecorda?: () => void; userId?: string } = {}) {
  const { userId } = options;
  const onCreateRecorda = userId ? undefined : (options.onCreateRecorda ?? jest.fn());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Thumbnails read the token from the cache; seeding it keeps them from updating after render.
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, "token");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>{children}</PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  return render(<MemoryCalendarTab onCreateRecorda={onCreateRecorda} userId={userId} />, {
    wrapper
  });
}

describe("MemoryCalendarTab", () => {
  it("keeps the header and shows a skeleton cell per day while loading", async () => {
    setToday(OCTOBER);
    mockGetMonthCalendar.mockReturnValue(new Promise(() => undefined));

    renderTab();

    expect(await screen.findAllByTestId("calendar-skeleton-cell")).toHaveLength(31);
    expect(screen.getByTestId("memory-calendar-days").props.accessibilityLabel).toBe(
      "Carregando calendário"
    );
    expect(screen.getByRole("button", { name: "Próximo mês" })).toBeTruthy();
    expect(mockGetMonthCalendar).toHaveBeenCalledWith(2026, 10, expect.anything(), undefined);
  });

  it("renders the current month's days without the empty state", async () => {
    setToday(OCTOBER);

    renderTab();

    expect(
      await screen.findByTestId(`calendar-day-thumbnail-${october.days[0].date}`)
    ).toBeTruthy();
    expect(screen.queryByTestId("calendar-skeleton-cell")).toBeNull();
    expect(screen.queryByTestId("calendar-empty-state")).toBeNull();
  });

  it("opens the day viewer on a day with Recordas and closes it again", async () => {
    setToday(OCTOBER);
    const day = october.days[0];

    renderTab();
    fireEvent.press(await screen.findByTestId(`calendar-day-${day.date}`));

    expect(screen.getByTestId("viewer-date")).toHaveTextContent(day.date);
    expect(mockViewer).toHaveBeenLastCalledWith(expect.objectContaining({ visible: true }));
    expect(screen.getByTestId(`calendar-day-ring-${day.date}`)).toBeTruthy();

    fireEvent.press(screen.getByTestId("viewer-close"));

    expect(screen.queryByTestId("viewer-date")).toBeNull();
  });

  it("loads another user's calendar and hands the user to the day viewer", async () => {
    setToday(OCTOBER);

    renderTab({ userId: "user-2" });

    fireEvent.press(await screen.findByTestId(`calendar-day-${october.days[0].date}`));
    expect(mockGetMonthCalendar).toHaveBeenCalledWith(2026, 10, expect.any(AbortSignal), "user-2");
    expect(mockViewer).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: october.days[0].date, userId: "user-2" })
    );
  });

  it("shows an empty state without a camera shortcut on another user's empty month", async () => {
    setToday(DECEMBER);

    renderTab({ userId: "user-2" });

    expect(await screen.findByTestId("calendar-empty-state")).toBeTruthy();
    expect(screen.getByText("Este mês ainda está em branco")).toBeTruthy();
    expect(screen.queryByText("Criar Recorda")).toBeNull();
  });

  it("ignores a day summary without Recordas", async () => {
    setToday(OCTOBER);
    const zero = { ...october.days[0], count: 0 };
    mockGetMonthCalendar.mockResolvedValue({ ...october, days: [zero] });

    renderTab();
    fireEvent.press(await screen.findByTestId(`calendar-day-${zero.date}`));

    expect(screen.queryByTestId("viewer-date")).toBeNull();
  });

  it("shows the empty state with a camera shortcut when the current month has no Recordas", async () => {
    setToday(DECEMBER);
    const onCreateRecorda = jest.fn();

    renderTab({ onCreateRecorda });

    expect(await screen.findByText("Seu mês ainda está em branco")).toBeTruthy();
    expect(screen.getByTestId("memory-calendar-grid")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Criar Recorda" }));

    expect(onCreateRecorda).toHaveBeenCalledTimes(1);
  });

  it("decides emptiness by the month's total, not by the days listed", async () => {
    setToday(OCTOBER);
    mockGetMonthCalendar.mockResolvedValue({
      ...october,
      active_days_count: 0,
      days: [{ ...october.days[0], count: 0 }],
      total_memories: 0
    });

    renderTab();

    expect(await screen.findByTestId("calendar-empty-state")).toBeTruthy();
  });

  it("leaves other empty months to the header summary", async () => {
    setToday(OCTOBER);

    renderTab();
    await screen.findByTestId(`calendar-day-${october.days[0].date}`);
    fireEvent.press(screen.getByRole("button", { name: "Mês anterior" }));
    fireEvent.press(screen.getByRole("button", { name: "Mês anterior" }));

    expect(await screen.findByText("Nenhuma memória neste mês")).toBeTruthy();
    expect(mockGetMonthCalendar).toHaveBeenLastCalledWith(2026, 8, expect.anything(), undefined);
    expect(screen.queryByTestId("calendar-empty-state")).toBeNull();
  });

  it("shows a friendly error under the header, still navigable, and retries", async () => {
    setToday(OCTOBER);
    mockGetMonthCalendar.mockRejectedValueOnce(new Error("offline"));

    renderTab();

    expect(await screen.findByText("Não foi possível carregar o calendário.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Próximo mês" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      await screen.findByTestId(`calendar-day-thumbnail-${october.days[0].date}`)
    ).toBeTruthy();
    expect(screen.queryByText("Não foi possível carregar o calendário.")).toBeNull();
  });

  it.each([
    ["en", "Your month is still blank", "Create Recorda"],
    ["es", "Tu mes todavía está en blanco", "Crear Recorda"]
  ])("translates the empty state to %s", async (language, title, action) => {
    setToday(DECEMBER);
    await act(() => i18n.changeLanguage(language));

    renderTab();

    expect(await screen.findByText(title)).toBeTruthy();
    expect(screen.getByRole("button", { name: action })).toBeTruthy();
  });
});
