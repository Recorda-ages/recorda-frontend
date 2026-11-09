import React from "react";
import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import {
  DayMemoriesViewerModal,
  shouldDismiss
} from "@/features/memories-calendar/components/DayMemoriesViewerModal";
import { memoryCalendarMock } from "@/features/memories-calendar/mocks/memoryCalendarMock";
import { dayMemoriesQueryKey } from "@/features/memories-calendar/queryKeys";
import { memoryCalendarService } from "@/features/memories-calendar/services/memoryCalendarService";
import type { DailyMemoriesResponse } from "@/features/memories-calendar/types";
import { authApiClient } from "@/services/api";

import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

jest.mock("@/features/memories-calendar/services/memoryCalendarService", () => ({
  memoryCalendarService: { getDayMemories: jest.fn(), getMonthCalendar: jest.fn() }
}));

const getDayMemories = jest.mocked(memoryCalendarService.getDayMemories);
const FRESH_PREVIEW = "https://cdn.example.com/preview.mp3";
// 2026-10-03 has three Recordas in the mock: photo, video, photo.
const DAY_WITH_THREE = "2026-10-03";
const FIRST_DAY = "2026-09-30";
const LAST_DAY = "2026-11-02";

function renderViewer(date = DAY_WITH_THREE, onClose = jest.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = (value: string) => (
    <QueryClientProvider client={client}>
      <DayMemoriesViewerModal date={value} onClose={onClose} visible />
    </QueryClientProvider>
  );
  const { rerender } = render(view(date));
  return { client, onClose, setDate: (value: string) => rerender(view(value)) };
}

function swipeTo(index: number) {
  fireEvent(screen.getByTestId("day-memories-carousel"), "momentumScrollEnd", {
    nativeEvent: { contentOffset: { x: Dimensions.get("window").width * index, y: 0 } }
  });
}

// A single finger moving vertically, in the shape PanResponder reads from touchHistory.
function touchEvent(pageY: number, previousPageY: number, timestamp: number) {
  return {
    nativeEvent: { changedTouches: [], pageX: 0, pageY, timestamp, touches: [] },
    touchHistory: {
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timestamp,
      numberActiveTouches: 1,
      touchBank: [
        {
          currentPageX: 0,
          currentPageY: pageY,
          currentTimeStamp: timestamp,
          previousPageX: 0,
          previousPageY,
          previousTimeStamp: timestamp - 1,
          startPageX: 0,
          startPageY: 0,
          startTimeStamp: 0,
          touchActive: true
        }
      ]
    }
  };
}

const NEGOTIATION_OFFSET = 20;

// Drives the responder handlers directly: the viewer only claims the gesture on move
// (onStartShouldSetResponder is false), which fireEvent treats as a disabled target.
// As on a device, a first small move negotiates the gesture: the capture phase updates
// the gesture state that the bubbling check then reads.
function pullDown(distance: number, durationMs: number) {
  const { props } = screen.getByTestId("day-memories-viewer");
  const offset = Math.sign(distance) * NEGOTIATION_OFFSET;
  const start = touchEvent(offset, 0, 100);
  props.onMoveShouldSetResponderCapture(start);
  const claimed: boolean = props.onMoveShouldSetResponder(start);
  if (!claimed) return false;
  act(() => {
    props.onResponderGrant(start);
    props.onResponderMove(touchEvent(offset + distance, offset, durationMs));
    props.onResponderRelease(touchEvent(offset + distance, offset + distance, durationMs + 1));
  });
  return true;
}

function selectedSegment() {
  return screen
    .getAllByTestId(/^day-pagination-segment-/)
    .findIndex((segment) => segment.props.accessibilityState?.selected);
}

// Cache updates reach the screen right away instead of on a timer that lags under load.
beforeAll(() => notifyManager.setScheduler((callback) => callback()));
afterAll(() => notifyManager.setScheduler((callback) => setTimeout(callback, 0)));

beforeEach(() => {
  resetAudioMock();
  getDayMemories.mockReset().mockImplementation(memoryCalendarMock.getDayMemories);
  jest.spyOn(authApiClient, "get").mockResolvedValue({ preview_url: FRESH_PREVIEW });
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("opens on the first Recorda of the day and plays its song preview", async () => {
  renderViewer();

  expect(await screen.findByTestId("day-memories-carousel")).toBeTruthy();
  expect(screen.getAllByTestId(/^day-pagination-segment-/)).toHaveLength(3);
  expect(selectedSegment()).toBe(0);
  expect(screen.getByText("Harder, Better, Faster, Stronger")).toBeTruthy();
  expect(screen.getByText("Daft Punk")).toBeTruthy();
  await waitFor(() => expect(mockAudioPlayer.play).toHaveBeenCalled());
  expect(mockAudioPlayer.replace).toHaveBeenCalledTimes(1);
});

it("shows the like and comment counters of the Recorda", async () => {
  renderViewer();
  await screen.findByTestId("day-memories-carousel");

  const first = (await memoryCalendarMock.getDayMemories(DAY_WITH_THREE)).memories[0];
  const likes = screen.getByTestId(`day-memory-likes-${first.recorda_id}`);
  const comments = screen.getByTestId(`day-memory-comments-${first.recorda_id}`);
  expect(likes.props.accessibilityLabel).toBe(`${first.likes_count} curtidas`);
  expect(comments.props.accessibilityLabel).toBe(`${first.comments_count} comentários`);
});

it("moves to the next Recorda when the carousel is swiped", async () => {
  renderViewer();
  await screen.findByTestId("day-memories-carousel");

  swipeTo(1);

  expect(selectedSegment()).toBe(1);
});

it("pauses and resumes the preview from the pill", async () => {
  renderViewer();
  await waitFor(() => expect(mockAudioPlayer.play).toHaveBeenCalled());
  mockAudioPlayer.pause.mockClear();
  mockAudioPlayer.play.mockClear();

  fireEvent.press(screen.getByLabelText("Pausar música"));
  expect(mockAudioPlayer.pause).toHaveBeenCalled();

  fireEvent.press(screen.getByLabelText("Tocar música"));
  expect(mockAudioPlayer.play).toHaveBeenCalled();
});

it("jumps between days that have memories without closing", async () => {
  renderViewer();
  await screen.findByTestId("day-memories-carousel");

  fireEvent.press(screen.getByLabelText("Próximo dia"));
  await waitFor(() =>
    expect(getDayMemories).toHaveBeenLastCalledWith(
      "2026-10-12",
      expect.any(AbortSignal),
      undefined
    )
  );
  await waitFor(() => expect(screen.getAllByTestId(/^day-pagination-segment-/)).toHaveLength(1));

  fireEvent.press(screen.getByLabelText("Dia anterior"));
  await waitFor(() => expect(screen.getAllByTestId(/^day-pagination-segment-/)).toHaveLength(3));
});

it("hides the day buttons at the edges of the calendar", async () => {
  renderViewer(FIRST_DAY);
  await screen.findByTestId("day-memories-carousel");
  expect(screen.queryByLabelText("Dia anterior")).toBeNull();
  expect(screen.getByLabelText("Próximo dia")).toBeTruthy();

  screen.unmount();
  renderViewer(LAST_DAY);
  await screen.findByTestId("day-memories-carousel");
  expect(screen.queryByLabelText("Próximo dia")).toBeNull();
  expect(screen.getByLabelText("Dia anterior")).toBeTruthy();
});

it("closes from the X button and stops the audio", async () => {
  const { onClose } = renderViewer();
  await screen.findByTestId("day-memories-carousel");
  mockAudioPlayer.pause.mockClear();

  fireEvent.press(screen.getByLabelText("Fechar"));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(mockAudioPlayer.pause).toHaveBeenCalled();
});

it("closes on a long pull down and releases the audio", async () => {
  const { onClose } = renderViewer();
  await screen.findByTestId("day-memories-carousel");
  mockAudioPlayer.pause.mockClear();

  expect(pullDown(200, 1000)).toBe(true);

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(mockAudioPlayer.pause).toHaveBeenCalled();
});

it("stays open after a short, slow pull down", async () => {
  const { onClose } = renderViewer();
  await screen.findByTestId("day-memories-carousel");

  // The gesture is claimed (vertical, downwards) but too short and slow to dismiss.
  expect(pullDown(40, 1000)).toBe(true);

  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByTestId("day-memories-carousel")).toBeTruthy();
});

it("leaves upward drags to the content", async () => {
  const { onClose } = renderViewer();
  await screen.findByTestId("day-memories-carousel");

  expect(pullDown(-200, 1000)).toBe(false);
  expect(onClose).not.toHaveBeenCalled();
});

it("shows a translated error that can be retried, keeping the close button", async () => {
  getDayMemories.mockRejectedValueOnce(new Error("offline"));
  renderViewer();

  expect(await screen.findByText("Não foi possível carregar as memórias deste dia.")).toBeTruthy();
  expect(screen.getByLabelText("Fechar")).toBeTruthy();

  fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

  expect(await screen.findByTestId("day-memories-carousel")).toBeTruthy();
  expect(getDayMemories).toHaveBeenCalledTimes(2);
});

it("renders nothing while not visible", () => {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <DayMemoriesViewerModal date={DAY_WITH_THREE} onClose={jest.fn()} visible={false} />
    </QueryClientProvider>
  );

  expect(screen.queryByTestId("day-memories-viewer")).toBeNull();
  expect(getDayMemories).not.toHaveBeenCalled();
});

it("resumes the song on the next Recorda after pausing the previous one", async () => {
  renderViewer();
  await waitFor(() => expect(mockAudioPlayer.play).toHaveBeenCalled());
  fireEvent.press(screen.getByLabelText("Pausar música"));
  mockAudioPlayer.play.mockClear();

  // Every Recorda of the mock day uses the same song.
  swipeTo(1);

  expect(mockAudioPlayer.play).toHaveBeenCalled();
  expect(screen.getByLabelText("Pausar música")).toBeTruthy();
});

it("keeps the play button disabled while the preview link is not loaded", async () => {
  jest.spyOn(authApiClient, "get").mockReturnValue(new Promise(() => undefined));
  renderViewer();
  await screen.findByTestId("day-memories-carousel");

  expect(screen.getByTestId("music-preview-toggle")).toBeDisabled();
  // Nothing plays yet, so the pill does not offer to pause.
  expect(screen.getByLabelText("Tocar música")).toBeTruthy();
  expect(mockAudioPlayer.play).not.toHaveBeenCalled();
});

it("falls back to the last Recorda when a refetch brings fewer of them", async () => {
  const { client } = renderViewer();
  await screen.findByTestId("day-memories-carousel");
  swipeTo(2);

  await act(async () => {
    client.setQueryData<DailyMemoriesResponse>(dayMemoriesQueryKey(DAY_WITH_THREE), (data) =>
      data ? { ...data, memories: data.memories.slice(0, 1), total_count: 1 } : data
    );
  });

  await waitFor(() => expect(screen.getAllByTestId(/^day-pagination-segment-/)).toHaveLength(1));
  expect(selectedSegment()).toBe(0);
  expect(screen.getByTestId("music-preview-pill")).toBeTruthy();
});

it("follows a new date chosen while the viewer is open", async () => {
  const { setDate } = renderViewer();
  await screen.findByTestId("day-memories-carousel");

  setDate("2026-10-12");

  await waitFor(() =>
    expect(getDayMemories).toHaveBeenLastCalledWith(
      "2026-10-12",
      expect.any(AbortSignal),
      undefined
    )
  );
});

describe("shouldDismiss", () => {
  it("closes on a long or fast pull down and springs back otherwise", () => {
    expect(shouldDismiss(150, 0)).toBe(true);
    expect(shouldDismiss(40, 1.2)).toBe(true);
    expect(shouldDismiss(40, 0.2)).toBe(false);
    expect(shouldDismiss(-200, -2)).toBe(false);
  });
});
