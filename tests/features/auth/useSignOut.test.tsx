import { act, cleanup, renderHook } from "@testing-library/react-native";

import { AppProviders } from "@/app/providers/AppProviders";
import { queryClient } from "@/app/providers/queryClient";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { saveSession } from "@/features/auth/session";
import { useFeedAudioActions, useFeedFocusKey } from "@/features/feed/state/FeedAudioContext";
import { useFeed } from "@/features/feed/state/FeedContext";
import { useOnboarding } from "@/features/onboarding/state/OnboardingContext";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";
import { i18n } from "@/i18n";
import { secureStorage } from "@/services/storage";

import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

const mockReset = jest.fn();
const mockStorage = new Map<string, string>();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ reset: mockReset })
}));
jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStorage.delete(key);
    })
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.clear();
  resetAudioMock();
  queryClient.clear();
});
afterEach(async () => {
  cleanup();
  queryClient.clear();
  await i18n.changeLanguage("pt-BR");
});

it("resets real contexts, stops audio and clears the previous account before resetting navigation", async () => {
  await i18n.changeLanguage("es");
  await secureStorage.setItem("app_language", "es");
  await saveSession({
    access_token: "old-token",
    token_type: "bearer",
    user: { user_id: "old", role: "USER", name: "Old", username: "old", onboarding_completed: true }
  });
  queryClient.setQueryData(["profile", "old"], { name: "private profile" });
  queryClient.setQueryData(["user-search", "ana"], { users: ["private result"] });
  const { result } = renderHook(
    () => ({
      signOut: useSignOut(),
      onboarding: useOnboarding(),
      draft: useRecordaDraft(),
      audio: useFeedAudioActions(),
      focusKey: useFeedFocusKey(),
      feed: useFeed()
    }),
    { wrapper: AppProviders }
  );
  act(() => {
    result.current.onboarding.setSelectedArtists([{ id: 1, name: "Artist" }]);
    result.current.onboarding.setSelectedGenres([{ id: 2, name: "Genre" }]);
    result.current.draft.setMedia({ type: "photo", uri: "file://private.jpg" });
    result.current.draft.setDescription("private draft");
    result.current.draft.setSong({
      deezerTrackId: "1",
      title: "Song",
      artistName: "Artist",
      coverUrl: "cover.jpg",
      previewUrl: null
    });
    result.current.audio.setActiveRoute("Feed");
    result.current.audio.setActivePreview("old-recorda", "https://example.com/preview.mp3");
    result.current.feed.setLikeState("old-recorda", true);
    result.current.feed.deletePost("old-deleted-recorda");
  });
  expect(result.current.feed.likedIds).toEqual(["old-recorda"]);
  expect(result.current.feed.deletedIds).toEqual(["old-deleted-recorda"]);
  expect(mockAudioPlayer.play).toHaveBeenCalled();
  mockAudioPlayer.pause.mockClear();
  mockReset.mockImplementationOnce(() => {
    expect(mockStorage.has("auth_token")).toBe(false);
    expect(mockStorage.has("role")).toBe(false);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  await act(async () => result.current.signOut());

  expect(result.current.onboarding.selectedArtists).toEqual([]);
  expect(result.current.onboarding.selectedGenres).toEqual([]);
  expect(result.current.draft).toMatchObject({ description: "", media: null, song: null });
  expect(result.current.focusKey).toBeNull();
  expect(result.current.feed.likedIds).toEqual([]);
  expect(result.current.feed.deletedIds).toEqual([]);
  expect(mockAudioPlayer.pause).toHaveBeenCalled();
  expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
  expect(mockStorage.get("app_language")).toBe("es");
  expect(i18n.language).toBe("pt-BR");

  mockAudioPlayer.play.mockClear();
  act(() => result.current.audio.setActiveRoute("Feed"));
  expect(mockAudioPlayer.play).not.toHaveBeenCalled();
  await act(async () =>
    saveSession({
      access_token: "new-token",
      token_type: "bearer",
      user: {
        user_id: "new",
        role: "USER",
        name: "New",
        username: "new",
        onboarding_completed: true
      }
    })
  );
  expect(queryClient.getQueryData(["profile", "old"])).toBeUndefined();
  expect(queryClient.getQueryData(["user-search", "ana"])).toBeUndefined();
});
