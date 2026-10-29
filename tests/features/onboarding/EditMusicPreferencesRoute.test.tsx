import type { NavigationAction } from "@react-navigation/native";
import { CommonActions } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert, type AlertButton } from "react-native";
import { I18nextProvider } from "react-i18next";

import { useArtistSearch } from "@/features/music/hooks/useArtistSearch";
import { usePopularArtists } from "@/features/music/hooks/usePopularArtists";
import { useGenres } from "@/features/music/hooks/useGenres";
import {
  getMusicPreferences,
  getPopularTracks,
  saveMusicPreferences,
  searchTracks
} from "@/features/onboarding/api/music";
import { ACCOUNT_QUERY_KEY } from "@/features/account/queryKeys";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { resetPrivateState } from "@/services/api/sessionLifecycle";
import { EditMusicPreferencesRoute } from "@/features/onboarding/screens/EditMusicPreferencesRoute";
import { MUSIC_PREFERENCES_QUERY_KEY } from "@/features/onboarding/queryKeys";
import type { MusicPreferences, MusicTrack } from "@/features/onboarding/types";
import { USER_SUGGESTIONS_QUERY_KEY } from "@/features/follow/queryKeys";
import { i18n } from "@/i18n";

let mockNavigation: {
  dispatch: jest.Mock;
  goBack: jest.Mock;
  getState: jest.Mock;
};
let mockShouldPreventRemoval = false;
let mockRemovalCallback: ((event: { data: { action: NavigationAction } }) => void) | undefined;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation,
  usePreventRemove: (
    shouldPrevent: boolean,
    callback: (event: { data: { action: NavigationAction } }) => void
  ) => {
    mockShouldPreventRemoval = shouldPrevent;
    mockRemovalCallback = callback;
  }
}));
jest.mock("@/features/onboarding/api/music", () => ({
  getMusicPreferences: jest.fn(),
  getPopularTracks: jest.fn(),
  saveMusicPreferences: jest.fn(),
  searchTracks: jest.fn()
}));
jest.mock("@/features/music/hooks/useArtistSearch", () => ({
  useArtistSearch: jest.fn()
}));
jest.mock("@/features/music/hooks/usePopularArtists", () => ({
  usePopularArtists: jest.fn()
}));
jest.mock("@/features/music/hooks/useGenres", () => ({
  useGenres: jest.fn()
}));

const initialPreferences: MusicPreferences = {
  artists: [
    { id: 10, name: "Artist One" },
    { id: 20, name: "Artist Two" },
    { id: 30, name: "Artist Three" }
  ],
  genres: [
    { id: 110, name: "Genre One" },
    { id: 120, name: "Genre Two" },
    { id: 130, name: "Genre Three" }
  ],
  track: { id: 1, title: "Saved song", artist: "Saved artist" }
};
const replacementTrack: MusicTrack = {
  id: 2,
  title: "New song",
  artist: "New artist",
  artworkUrl: "https://cdn/new.jpg"
};

const mockGetMusicPreferences = jest.mocked(getMusicPreferences);
const mockGetPopularTracks = jest.mocked(getPopularTracks);
const mockSaveMusicPreferences = jest.mocked(saveMusicPreferences);
const mockSearchTracks = jest.mocked(searchTracks);
const mockUseArtistSearch = jest.mocked(useArtistSearch);
const mockUsePopularArtists = jest.mocked(usePopularArtists);
const mockUseGenres = jest.mocked(useGenres);
let alertButtons: AlertButton[] = [];

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0, retry: false },
      mutations: { gcTime: 0, retry: false }
    }
  });
}

function renderRoute(client = createClient()) {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <EditMusicPreferencesRoute />
      </QueryClientProvider>
    </I18nextProvider>
  );

  return client;
}

async function openMusicStep(client = createClient()) {
  renderRoute(client);
  await screen.findByText("ETAPA 1 DE 3");
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));
  await screen.findByText("ETAPA 2 DE 3");
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));
  await screen.findByText("ETAPA 3 DE 3");
  return client;
}

beforeEach(() => {
  jest.resetAllMocks();
  mockShouldPreventRemoval = false;
  mockRemovalCallback = undefined;
  alertButtons = [];
  mockNavigation = {
    dispatch: jest.fn(),
    goBack: jest.fn(() => {
      const action = CommonActions.goBack();
      if (mockShouldPreventRemoval && mockRemovalCallback) {
        mockRemovalCallback({ data: { action } });
      } else {
        mockNavigation.dispatch(action);
      }
    }),
    getState: jest.fn(() => ({
      index: 1,
      routes: [
        { key: "settings-key", name: "Settings" },
        { key: "editor-key", name: "EditMusicPreferences" }
      ]
    }))
  };
  jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
    alertButtons = buttons ?? [];
  });
  mockGetMusicPreferences.mockResolvedValue(initialPreferences);
  mockGetPopularTracks.mockResolvedValue([]);
  mockSearchTracks.mockResolvedValue([replacementTrack]);
  mockSaveMusicPreferences.mockResolvedValue(undefined);
  mockUseArtistSearch.mockReturnValue({
    data: [],
    isError: false,
    isFetching: false,
    isSuccess: true
  } as unknown as ReturnType<typeof useArtistSearch>);
  mockUsePopularArtists.mockReturnValue({
    data: [],
    isError: false,
    isPending: false
  } as unknown as ReturnType<typeof usePopularArtists>);
  mockUseGenres.mockReturnValue({
    data: [
      ...initialPreferences.genres.map(({ id, name }) => ({ id, name, picture_url: null })),
      { id: 140, name: "Genre Four", picture_url: null }
    ],
    isError: false,
    isPending: false,
    isSuccess: true
  } as unknown as ReturnType<typeof useGenres>);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("shows a loading state while saved preferences are being read", async () => {
  let resolvePreferences: (preferences: MusicPreferences) => void = () => undefined;
  mockGetMusicPreferences.mockReturnValueOnce(
    new Promise((resolve) => {
      resolvePreferences = resolve;
    })
  );
  mockGetMusicPreferences.mockResolvedValueOnce(initialPreferences);

  renderRoute();

  expect(screen.getByText("Carregando preferências musicais")).toBeTruthy();
  resolvePreferences(initialPreferences);
  await screen.findByText("ETAPA 1 DE 3");
});

it("offers a back action and retries after the GET fails", async () => {
  mockGetMusicPreferences.mockRejectedValueOnce(new Error("offline"));
  mockGetMusicPreferences.mockResolvedValueOnce(initialPreferences);
  const client = createClient();
  renderRoute(client);
  expect(await screen.findByText("Não foi possível carregar suas preferências.")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

  await screen.findByText("ETAPA 1 DE 3");
  expect(mockGetMusicPreferences).toHaveBeenCalledTimes(2);
});

it("preselects saved artists and genres that load with the user's preferences", async () => {
  renderRoute();
  await screen.findByText("ETAPA 1 DE 3");

  expect(screen.getByRole("checkbox", { name: "Artist One" })).toBeChecked();
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));
  await screen.findByText("ETAPA 2 DE 3");

  expect(screen.getByRole("checkbox", { name: "Genre One" })).toBeChecked();
});

it("keeps a local draft across steps, preselects a saved song, saves, and refreshes dependent queries", async () => {
  const client = createClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");
  mockGetPopularTracks.mockResolvedValue([replacementTrack]);
  renderRoute(client);
  await screen.findByText("ETAPA 1 DE 3");
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));
  await screen.findByText("ETAPA 2 DE 3");
  fireEvent.press(screen.getByRole("checkbox", { name: "Genre Four" }));
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));
  await screen.findByText("ETAPA 3 DE 3");

  fireEvent.press(screen.getByRole("button", { name: "Voltar para gêneros" }));
  await screen.findByText("ETAPA 2 DE 3");
  expect(screen.getByRole("checkbox", { name: "Genre Four" })).toBeChecked();
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));
  await screen.findByText("ETAPA 3 DE 3");

  expect(screen.getByRole("radio", { name: "Saved song, Saved artist" })).toBeChecked();
  fireEvent.press(await screen.findByRole("radio", { name: "New song, New artist" }));
  fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

  await waitFor(() => {
    expect(mockSaveMusicPreferences.mock.calls[0]?.[0]).toEqual({
      ...initialPreferences,
      genres: [...initialPreferences.genres, { id: 140, name: "Genre Four" }],
      track: replacementTrack
    });
  });
  await waitFor(() =>
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "GO_BACK" })
    )
  );

  expect(client.getQueryData(MUSIC_PREFERENCES_QUERY_KEY)).toEqual({
    ...initialPreferences,
    genres: [...initialPreferences.genres, { id: 140, name: "Genre Four" }],
    track: replacementTrack
  });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ACCOUNT_QUERY_KEY });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: AUTH_ME_QUERY_KEY });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: USER_SUGGESTIONS_QUERY_KEY });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ["feed", "general"] });
  expect(mockNavigation.dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: "SET_PARAMS", source: "settings-key" })
  );
});

it("routes the visual back button and native removal through one discard confirmation", async () => {
  renderRoute();
  await screen.findByText("ETAPA 1 DE 3");

  fireEvent.press(screen.getByRole("checkbox", { name: "Artist One" }));
  act(() => mockRemovalCallback?.({ data: { action: CommonActions.goBack() } }));

  expect(Alert.alert).toHaveBeenCalledTimes(1);
  const continueEditing = alertButtons.find((button) => button.text === "Continuar editando");
  act(() => continueEditing?.onPress?.());
  expect(mockNavigation.dispatch).not.toHaveBeenCalled();

  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

  expect(Alert.alert).toHaveBeenCalledTimes(2);
  const discard = alertButtons.find((button) => button.text === "Descartar");
  act(() => discard?.onPress?.());

  await waitFor(() =>
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "GO_BACK" })
    )
  );
  expect(Alert.alert).toHaveBeenCalledTimes(2);
  expect(mockSaveMusicPreferences).not.toHaveBeenCalled();
});

it("keeps the draft and displays a retryable error when saving fails", async () => {
  mockSaveMusicPreferences.mockRejectedValueOnce(new Error("offline"));
  await openMusicStep();

  const savedSong = screen.getByRole("radio", { name: "Saved song, Saved artist" });
  expect(savedSong).toBeChecked();
  fireEvent.press(screen.getByRole("button", { name: "Salvar" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Não foi possível salvar. Suas escolhas foram mantidas. Tente novamente."
  );
  expect(screen.getByRole("radio", { name: "Saved song, Saved artist" })).toBeChecked();
  expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
});

describe("own profile after saving", () => {
  // Keeps unobserved queries alive, so the test can read their invalidation state.
  function profileClient() {
    const client = new QueryClient({
      defaultOptions: {
        queries: { gcTime: Infinity, retry: false },
        mutations: { gcTime: 0, retry: false }
      }
    });
    client.setQueryData(AUTH_ME_QUERY_KEY, { role: "USER", user_id: "user-1" });
    client.setQueryData(["profile", "user-1"], { user_id: "user-1" });
    client.setQueryData(["profile", "user-1", "recordas"], { pageParams: [null], pages: [] });
    client.setQueryData(["profile", "user-2"], { user_id: "user-2" });
    return client;
  }

  function isInvalidated(client: QueryClient, key: readonly unknown[]) {
    return client.getQueryState(key)?.isInvalidated;
  }

  async function save(client: QueryClient) {
    await openMusicStep(client);
    fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
  }

  it("refreshes only the own profile (favorite song), not its grid or other profiles", async () => {
    const client = profileClient();

    await save(client);

    await waitFor(() =>
      expect(mockNavigation.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "GO_BACK" })
      )
    );
    expect(isInvalidated(client, ["profile", "user-1"])).toBe(true);
    expect(isInvalidated(client, ["profile", "user-1", "recordas"])).toBe(false);
    expect(isInvalidated(client, ["profile", "user-2"])).toBe(false);
    // The chips read the preferences cache, which is still updated in place.
    expect(client.getQueryData(MUSIC_PREFERENCES_QUERY_KEY)).toEqual(initialPreferences);
  });

  it("leaves the profile alone when saving fails", async () => {
    mockSaveMusicPreferences.mockRejectedValueOnce(new Error("offline"));
    const client = profileClient();

    await save(client);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(isInvalidated(client, ["profile", "user-1"])).toBe(false);
  });

  it("skips the profile when the session changed during the save", async () => {
    let finishSave!: () => void;
    mockSaveMusicPreferences.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
    );
    const client = profileClient();

    await save(client);
    await waitFor(() => expect(mockSaveMusicPreferences).toHaveBeenCalled());
    resetPrivateState(); // sign out / account switch while the save is in flight
    await act(async () => finishSave());

    await waitFor(() =>
      expect(mockNavigation.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "GO_BACK" })
      )
    );
    expect(isInvalidated(client, ["profile", "user-1"])).toBe(false);
  });
});
