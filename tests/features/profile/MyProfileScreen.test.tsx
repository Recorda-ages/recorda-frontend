import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { getMusicPreferences } from "@/features/onboarding/api/music";
import type { MusicPreferences } from "@/features/onboarding/types";
import { MyProfileScreen } from "@/features/profile";
import { profileService } from "@/features/profile/services/profileService";
import type { ProfileRead, RecordaGridItem, RecordaGridPage } from "@/features/profile/types";
import { i18n } from "@/i18n";
import { ApiError, AUTH_TOKEN_QUERY_KEY } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: { getMyProfile: jest.fn(), getUserRecordas: jest.fn() }
}));

jest.mock("@/features/onboarding/api/music", () => ({
  ...jest.requireActual("@/features/onboarding/api/music"),
  getMusicPreferences: jest.fn()
}));

const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, reset: mockReset })
}));

const mockGetMyProfile = profileService.getMyProfile as jest.Mock;
const mockGetUserRecordas = profileService.getUserRecordas as jest.Mock;
const mockGetMusicPreferences = getMusicPreferences as jest.Mock;

const ME: CurrentUser = {
  name: "Natalia Yuk",
  onboarding_completed: true,
  role: "USER",
  user_id: "user-1",
  username: "natalia"
};

const PROFILE: ProfileRead = {
  can_view_content: true,
  counts: { followers: 15, following: 256, recordas: 6 },
  favorite_song: {
    artist_name: "Muse",
    cover_url: "https://cdn-images.dzcdn.net/images/cover/starlight.jpg",
    deezer_track_id: "3135553",
    preview_url: null,
    title: "Starlight"
  },
  is_private: false,
  name: "Natalia Yuk",
  profile_picture_url: null,
  relationship: { follow_id: null, follow_status: "nenhuma", is_self: true },
  streak: { current_days: 12, published_today: true },
  user_id: "user-1",
  username: "natalia"
};

const PREFERENCES: MusicPreferences = {
  artists: [
    { id: 412, name: "Imagine Dragons" },
    { id: 7, name: "Muse" }
  ],
  genres: [
    { id: 85, name: "Indie Rock" },
    { id: 152, name: "Rock" }
  ],
  track: { artist: "Muse", id: 3135553, title: "Starlight" }
};

function photo(id: string, createdAt: string): RecordaGridItem {
  return {
    created_at: createdAt,
    media_type: "PHOTO",
    media_url: `/api/v1/recordas/media/${id}.jpg`,
    recorda_id: id,
    song_artist_name: "Muse",
    song_cover_url: "",
    song_title: "Starlight"
  };
}

const PAGE: RecordaGridPage = {
  items: [photo("r3", "2026-10-27T12:00:00Z"), photo("r2", "2026-10-26T12:00:00Z")],
  next_cursor: null
};

const clients: QueryClient[] = [];

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: {
      // `retry` comes from the hooks; only the delay is removed here.
      queries: { gcTime: Infinity, retryDelay: 0 }
    }
  });
  clients.push(client);
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);
  client.setQueryData(AUTH_ME_QUERY_KEY, ME);

  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MyProfileScreen />
      </QueryClientProvider>
    </I18nextProvider>
  );

  return client;
}

async function renderLoaded() {
  const client = renderScreen();
  await screen.findByTestId("profile-header");
  return client;
}

function tileIds() {
  return screen
    .getAllByTestId(/^recorda-grid-item-/)
    .map((tile) => String(tile.props.testID).replace("recorda-grid-item-", ""));
}

function scrollToEnd() {
  fireEvent.scroll(screen.getByTestId("profile-scroll"), {
    nativeEvent: {
      contentOffset: { x: 0, y: 1500 },
      contentSize: { height: 2000, width: 390 },
      layoutMeasurement: { height: 700, width: 390 }
    }
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  [mockGetMyProfile, mockGetUserRecordas, mockGetMusicPreferences].forEach((mock) =>
    mock.mockReset()
  );
  mockGetMyProfile.mockResolvedValue(PROFILE);
  mockGetUserRecordas.mockResolvedValue(PAGE);
  mockGetMusicPreferences.mockResolvedValue(PREFERENCES);
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("MyProfileScreen", () => {
  it("shows the own profile: identity, counters and favorite song, without a follow button", async () => {
    await renderLoaded();

    expect(screen.getByText("Perfil")).toBeTruthy();
    expect(screen.getByText("Natalia Yuk")).toBeTruthy();
    expect(screen.getByText("@natalia")).toBeTruthy();
    expect(screen.getByLabelText("6 Recordas")).toBeTruthy();
    expect(screen.getByLabelText("15 Seguidores")).toBeTruthy();
    expect(screen.getByLabelText("256 Seguindo")).toBeTruthy();
    expect(screen.getByText("Starlight · Muse")).toBeTruthy();
    expect(screen.queryByText("Seguir")).toBeNull();
    expect(mockGetMyProfile).toHaveBeenCalled();
  });

  it("shows only the first favorite artist and genre", async () => {
    await renderLoaded();

    expect(await screen.findByLabelText("Artista favorito: Imagine Dragons")).toBeTruthy();
    expect(screen.getByLabelText("Gênero favorito: Indie Rock")).toBeTruthy();
    expect(screen.queryByLabelText("Artista favorito: Muse")).toBeNull();
    expect(screen.queryByLabelText("Gênero favorito: Rock")).toBeNull();
  });

  it("shows the profile while the music preferences are still loading", async () => {
    mockGetMusicPreferences.mockReturnValue(new Promise(() => undefined));
    await renderLoaded();

    expect(screen.getByText("Starlight · Muse")).toBeTruthy();
    expect(screen.queryByTestId(/^profile-favorite-artist-/)).toBeNull();
  });

  it("keeps the profile when the music preferences fail", async () => {
    mockGetMusicPreferences.mockRejectedValue(new ApiError("SERVER", "Boom", 500, null));
    await renderLoaded();

    await waitFor(() => expect(mockGetMusicPreferences).toHaveBeenCalled());
    expect(screen.getByText("Natalia Yuk")).toBeTruthy();
    expect(screen.queryByTestId(/^profile-favorite-artist-/)).toBeNull();
    expect(screen.queryByText("Não foi possível carregar o perfil.")).toBeNull();
  });

  describe("Recordas grid", () => {
    it("loads the own Recordas and keeps the backend order", async () => {
      await renderLoaded();

      await screen.findByTestId("recorda-grid");
      expect(mockGetUserRecordas).toHaveBeenCalledWith("user-1", null, expect.any(AbortSignal));
      expect(tileIds()).toEqual(["r3", "r2"]);
    });

    it("shows the empty state when there are no Recordas", async () => {
      mockGetUserRecordas.mockResolvedValue({ items: [], next_cursor: null });
      await renderLoaded();

      expect(await screen.findByText("Nenhuma Recorda publicada ainda.")).toBeTruthy();
    });

    it("opens a Recorda's details", async () => {
      await renderLoaded();

      fireEvent.press(await screen.findByTestId("recorda-grid-item-r2"));

      expect(mockNavigate).toHaveBeenCalledWith("PublishedRecorda", { postId: "r2" });
    });

    it("requests the next page near the end of the scroll, once at a time", async () => {
      let resolveNext: (page: RecordaGridPage) => void = () => undefined;
      mockGetUserRecordas
        .mockResolvedValueOnce({ ...PAGE, next_cursor: "cursor-2" })
        .mockReturnValueOnce(new Promise((resolve) => (resolveNext = resolve)));
      await renderLoaded();
      await screen.findByTestId("recorda-grid");

      scrollToEnd();
      await waitFor(() => expect(mockGetUserRecordas).toHaveBeenCalledTimes(2));
      expect(mockGetUserRecordas).toHaveBeenLastCalledWith(
        "user-1",
        "cursor-2",
        expect.any(AbortSignal)
      );
      expect(await screen.findByTestId("recorda-grid-loading-more")).toBeTruthy();

      scrollToEnd();
      expect(mockGetUserRecordas).toHaveBeenCalledTimes(2);

      await act(async () =>
        resolveNext({ items: [photo("r1", "2026-10-25T12:00:00Z")], next_cursor: null })
      );
      await waitFor(() => expect(tileIds()).toEqual(["r3", "r2", "r1"]));
    });

    it("keeps the loaded Recordas when the next page fails", async () => {
      mockGetUserRecordas
        .mockResolvedValueOnce({ ...PAGE, next_cursor: "cursor-2" })
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null))
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null));
      await renderLoaded();
      await screen.findByTestId("recorda-grid");

      scrollToEnd();

      expect(await screen.findByText("Não foi possível carregar mais Recordas.")).toBeTruthy();
      expect(tileIds()).toEqual(["r3", "r2"]);
    });

    it("refreshes profile and grid on pull to refresh", async () => {
      await renderLoaded();
      await screen.findByTestId("recorda-grid");
      const profileCalls = mockGetMyProfile.mock.calls.length;
      const gridCalls = mockGetUserRecordas.mock.calls.length;

      await act(async () => {
        screen.getByTestId("profile-scroll").props.refreshControl.props.onRefresh();
      });

      await waitFor(() => expect(mockGetMyProfile.mock.calls.length).toBe(profileCalls + 1));
      expect(mockGetUserRecordas.mock.calls.length).toBe(gridCalls + 1);
    });
  });

  describe("tabs", () => {
    it.each([
      ["Métricas", "metrics"],
      ["Calendário", "calendar"]
    ])("shows 'Em breve' on %s instead of the grid", async (name, key) => {
      await renderLoaded();

      fireEvent.press(screen.getByRole("tab", { name }));

      expect(screen.getByTestId(`profile-coming-soon-${key}`)).toHaveTextContent("Em breve");
      expect(screen.queryByTestId("recorda-grid")).toBeNull();
    });
  });

  describe("navigation", () => {
    it("opens Settings from the gear", async () => {
      await renderLoaded();

      fireEvent.press(screen.getByRole("button", { name: "Configurações" }));

      expect(mockNavigate).toHaveBeenCalledWith("Settings");
    });

    it("opens the followers and following lists on the right tab", async () => {
      await renderLoaded();

      fireEvent.press(screen.getByRole("button", { name: "15 Seguidores" }));
      fireEvent.press(screen.getByRole("button", { name: "256 Seguindo" }));

      expect(mockNavigate).toHaveBeenNthCalledWith(1, "Friends", {
        tab: "seguidores",
        userId: "user-1"
      });
      expect(mockNavigate).toHaveBeenNthCalledWith(2, "Friends", {
        tab: "seguindo",
        userId: "user-1"
      });
    });

    it("keeps the bottom tab bar on Perfil and navigates from it", async () => {
      await renderLoaded();

      expect(screen.getByRole("tab", { name: "Perfil" })).toBeSelected();
      fireEvent.press(screen.getByRole("tab", { name: "Criar Recorda" }));
      fireEvent.press(screen.getByRole("tab", { name: "Feed" }));
      fireEvent.press(screen.getByRole("tab", { name: "Perfil" }));

      expect(mockNavigate).toHaveBeenNthCalledWith(1, "Camera");
      expect(mockNavigate).toHaveBeenNthCalledWith(2, "Feed");
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });
  });

  describe("errors", () => {
    it("shows an error with a retry for a failed profile", async () => {
      // A 500 is retried once by the hook before the error shows.
      mockGetMyProfile
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null))
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null))
        .mockResolvedValueOnce(PROFILE);
      renderScreen();

      expect(await screen.findByText("Não foi possível carregar o perfil.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Configurações" })).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(await screen.findByTestId("profile-header")).toBeTruthy();
    });

    it("sends an incomplete onboarding (409) to OnboardingArtists, once", async () => {
      mockGetMyProfile.mockRejectedValue(
        new ApiError("CONFLICT", "Complete o onboarding musical.", 409, null)
      );
      renderScreen();

      await waitFor(() => expect(mockReset).toHaveBeenCalledTimes(1));
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "OnboardingArtists" }]
      });
      expect(mockGetMyProfile).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Não foi possível carregar o perfil.")).toBeNull();
    });
  });
});
