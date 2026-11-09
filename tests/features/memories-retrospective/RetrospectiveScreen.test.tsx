import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { RetrospectiveButton } from "@/features/memories-retrospective/components/RetrospectiveButton";
import { retrospectiveServiceMock } from "@/features/memories-retrospective/mocks/retrospectiveMock";
import {
  RetrospectiveScreen,
  SLIDE_DURATION_MS
} from "@/features/memories-retrospective/screens/RetrospectiveScreen";
import {
  retrospectiveStoryMock,
  toRetrospectiveStory
} from "@/features/memories-retrospective/storyData";
import { authApiClient } from "@/services/api";

import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

const FRESH_PREVIEW = "https://cdn.example.com/harder-better-faster-stronger.mp3";

function renderStory(onClose = jest.fn(), story = retrospectiveStoryMock) {
  return {
    onClose,
    ...render(
      <RetrospectiveScreen onClose={onClose} story={story} title="Sua retrospectiva" visible />
    )
  };
}

// Lets the preview link resolve and the player react to it.
async function flush() {
  await act(async () => undefined);
}

function advance(ms: number) {
  act(() => jest.advanceTimersByTime(ms));
}

function step(current: number) {
  return screen.queryByText(`Etapa ${current} de 5`);
}

beforeEach(() => {
  jest.useFakeTimers();
  resetAudioMock();
  jest.spyOn(authApiClient, "get").mockResolvedValue({ preview_url: FRESH_PREVIEW });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("opens on the first slide and plays the featured song in a loop", async () => {
  renderStory();
  await flush();

  expect(step(1)).toBeTruthy();
  expect(screen.getByText("28 Recordas")).toBeTruthy();
  expect(screen.getAllByTestId(/^story-progress-segment-/)).toHaveLength(5);
  expect(authApiClient.get).toHaveBeenCalledWith("/api/v1/music/tracks/3135556/preview");
  expect(mockAudioPlayer.replace).toHaveBeenCalledWith(FRESH_PREVIEW);
  expect(mockAudioPlayer.loop).toBe(true);
  expect(mockAudioPlayer.play).toHaveBeenCalled();
});

it("advances every five seconds and closes after the last slide", async () => {
  const { onClose } = renderStory();
  await flush();

  advance(SLIDE_DURATION_MS - 1);
  expect(step(1)).toBeTruthy();
  advance(1);
  expect(step(2)).toBeTruthy();
  expect(screen.getAllByText("Daft Punk").length).toBeGreaterThan(0);

  // One slide at a time: each timer is scheduled once the previous slide renders.
  for (const current of [3, 4, 5]) {
    advance(SLIDE_DURATION_MS);
    expect(step(current)).toBeTruthy();
  }
  mockAudioPlayer.pause.mockClear();
  advance(SLIDE_DURATION_MS);

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(mockAudioPlayer.pause).toHaveBeenCalled();
});

it("moves with taps on the sides and restarts the first slide", async () => {
  renderStory();
  await flush();

  fireEvent.press(screen.getByLabelText("Próximo slide"));
  expect(step(2)).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Slide anterior"));
  expect(step(1)).toBeTruthy();

  // Going back on the first slide restarts its five seconds.
  advance(3000);
  fireEvent.press(screen.getByLabelText("Slide anterior"));
  advance(SLIDE_DURATION_MS - 1);
  expect(step(1)).toBeTruthy();
  advance(1);
  expect(step(2)).toBeTruthy();
});

it("pauses the progress and the audio while holding, then resumes where it stopped", async () => {
  renderStory();
  await flush();
  const zone = screen.getByLabelText("Próximo slide");

  advance(2000);
  mockAudioPlayer.pause.mockClear();
  fireEvent(zone, "longPress");
  expect(mockAudioPlayer.pause).toHaveBeenCalled();

  advance(SLIDE_DURATION_MS * 2);
  expect(step(1)).toBeTruthy();

  mockAudioPlayer.play.mockClear();
  fireEvent(zone, "pressOut");
  expect(mockAudioPlayer.play).toHaveBeenCalled();
  advance(SLIDE_DURATION_MS - 2000 - 1);
  expect(step(1)).toBeTruthy();
  advance(1);
  expect(step(2)).toBeTruthy();
});

it("shows the five themed slides with the six metrics", async () => {
  renderStory();
  await flush();
  const next = () => fireEvent.press(screen.getByLabelText("Próximo slide"));

  expect(screen.getByText("28 Recordas")).toBeTruthy();
  next();
  expect(screen.getByText("Harder, Better, Faster, Stronger")).toBeTruthy();
  expect(screen.getByText("The Beatles")).toBeTruthy();
  next();
  expect(screen.getByText("Rock")).toBeTruthy();
  expect(screen.getByText("46%")).toBeTruthy();
  next();
  expect(screen.getByText("@pedro")).toBeTruthy();
  expect(screen.getByText("7 marcações")).toBeTruthy();
  next();
  expect(screen.getByText("214")).toBeTruthy();
  expect(screen.getByText("37")).toBeTruthy();
  expect(screen.getByText("12 dias")).toBeTruthy();
});

it("adds the shareable summary as a sixth step that waits for the user", async () => {
  const onClose = jest.fn();
  render(
    <RetrospectiveScreen
      onClose={onClose}
      story={retrospectiveStoryMock}
      summary={{
        activeDays: 19,
        commentsReceived: 37,
        featuredSongTitle: "Vienna",
        likesReceived: 214,
        maxStreak: 12,
        periodLabel: "2026",
        topArtistName: "Daft Punk",
        topGenreName: "Rock",
        topTaggedUsername: "pedro",
        totalRecordas: 28
      }}
      title="Sua retrospectiva"
      visible
    />
  );
  await flush();

  for (let slide = 0; slide < 5; slide += 1) advance(SLIDE_DURATION_MS);
  expect(screen.getByText("Etapa 6 de 6")).toBeTruthy();
  expect(screen.getByTestId("retrospective-summary")).toBeTruthy();

  for (let wait = 0; wait < 3; wait += 1) advance(SLIDE_DURATION_MS);
  expect(onClose).not.toHaveBeenCalled();

  fireEvent.press(screen.getByTestId("retrospective-summary-finish"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it("closes from the X button and releases the audio", async () => {
  const { onClose } = renderStory();
  await flush();
  mockAudioPlayer.pause.mockClear();

  fireEvent.press(screen.getByLabelText("Fechar"));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(mockAudioPlayer.pause).toHaveBeenCalled();
});

it("releases the audio player without touching the released native object when unmounted", async () => {
  const { onClose, rerender } = renderStory();
  await flush();

  rerender(
    <RetrospectiveScreen
      onClose={onClose}
      story={retrospectiveStoryMock}
      title="Sua retrospectiva"
      visible={false}
    />
  );

  expect(mockAudioPlayer.release).toHaveBeenCalledTimes(1);
});

it("maps canonical retrospective details to the story model", async () => {
  const details = await retrospectiveServiceMock.getRetrospective({
    month: 10,
    period_type: "MONTHLY",
    year: 2026
  });
  expect(details).not.toBeNull();
  const story = toRetrospectiveStory(details!);

  expect(story.total_recordas).toBe(details!.total_recordas);
  expect(story.top_artists[0]).toEqual({
    name: details!.top_artists[0].artist_name,
    recordas_count: details!.top_artists[0].memory_count
  });
  expect(story.top_genres[0]).toEqual({
    name: details!.top_genres[0].genre_name,
    percentage: details!.top_genres[0].percentage
  });
  expect(story.tagged_users[0]).toEqual({
    avatar_url: details!.tagged_users[0].profile_picture_url,
    tags_count: details!.tagged_users[0].tag_count,
    user_id: details!.tagged_users[0].user_id,
    username: details!.tagged_users[0].username
  });
  expect(story.engagement).toEqual({
    comments: details!.engagement.comments_received,
    likes: details!.engagement.likes_received
  });
  expect(story.featured_song?.title).toBe(details!.featured_song?.song_title);

  const withoutSong = toRetrospectiveStory({ ...details!, featured_song: null });
  expect(withoutSong.featured_song).toBeNull();
});

it("keeps working without a featured song", () => {
  renderStory(jest.fn(), { ...retrospectiveStoryMock, featured_song: null });

  expect(mockAudioPlayer.replace).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText("Próximo slide"));
  expect(screen.queryByTestId("retrospective-featured-song")).toBeNull();
});

it("renders nothing while not visible", () => {
  render(
    <RetrospectiveScreen
      onClose={jest.fn()}
      story={retrospectiveStoryMock}
      title="Sua retrospectiva"
      visible={false}
    />
  );

  expect(screen.queryByTestId("retrospective-screen")).toBeNull();
});

it("opens the retrospective from the button", () => {
  const onPress = jest.fn();
  render(<RetrospectiveButton onPress={onPress} size={28} />);

  fireEvent.press(screen.getByLabelText("Abrir retrospectiva"));

  expect(onPress).toHaveBeenCalledTimes(1);
});
