import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { followService } from "@/features/follow/services/followService";
import { reportService } from "@/features/moderation/services/reportService";
import { PROFILE_AVATAR_CENTER_Y, UserProfileScreen } from "@/features/profile";
import { userMetricsService } from "@/features/memories-metrics/services/userMetricsService";
import { profileService } from "@/features/profile/services/profileService";
import type { ProfileRead, RecordaGridItem, RecordaGridPage } from "@/features/profile/types";
import { i18n } from "@/i18n";
import { ApiError, AUTH_TOKEN_QUERY_KEY } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: {
    getUserMusicTastes: jest.fn(),
    getUserProfile: jest.fn(),
    getUserRecordas: jest.fn()
  }
}));

jest.mock("@/features/memories-metrics/services/userMetricsService", () => ({
  userMetricsService: { getProfileMetrics: jest.fn() }
}));

jest.mock("@/features/follow/services/followService", () => ({
  followService: { follow: jest.fn(), unfollow: jest.fn() }
}));

jest.mock("@/features/moderation/services/reportService", () => ({
  reportService: { reportRecorda: jest.fn(), reportUser: jest.fn() }
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockReplace = jest.fn();
let mockRoute = { params: { userId: "user-2" } };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate, replace: mockReplace }),
  useRoute: () => mockRoute
}));

const mockGetUserProfile = profileService.getUserProfile as jest.Mock;
const mockGetUserRecordas = profileService.getUserRecordas as jest.Mock;
const mockGetTastes = profileService.getUserMusicTastes as jest.Mock;
const mockGetMetrics = userMetricsService.getProfileMetrics as jest.Mock;
const mockFollow = followService.follow as jest.Mock;
const mockUnfollow = followService.unfollow as jest.Mock;
const mockReportUser = reportService.reportUser as jest.Mock;

const VIEWER: CurrentUser = {
  name: "Viewer",
  onboarding_completed: true,
  role: "USER",
  user_id: "user-1",
  username: "viewer"
};

function makeProfile(overrides: Partial<ProfileRead> = {}): ProfileRead {
  return {
    can_view_content: true,
    counts: { followers: 15, following: 256, recordas: 6 },
    favorite_song: {
      artist_name: "Muse",
      cover_url: "https://cdn.example.com/starlight.jpg",
      deezer_track_id: "123",
      preview_url: null,
      title: "Starlight"
    },
    is_private: false,
    name: "Lucas Almeida",
    profile_picture_url: null,
    relationship: { follow_id: null, follow_status: "nenhuma", is_self: false },
    streak: null,
    user_id: "user-2",
    username: "lucas_almeida",
    ...overrides
  };
}

const METRICS = {
  monthly_distribution: [],
  period: "last_30_days",
  streak: { current_streak_days: 0, last_post_date: null },
  top_artist: null,
  top_artists: [],
  top_genres: [],
  total_recordas: 0
};

const PRIVATE_LOCKED = makeProfile({ can_view_content: false, counts: null, is_private: true });

function gridItem(id: string, createdAt: string): RecordaGridItem {
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

// Newest first, as the backend sends them.
const GRID_PAGE: RecordaGridPage = {
  items: [gridItem("r3", "2026-10-27T12:00:00Z"), gridItem("r2", "2026-10-26T12:00:00Z")],
  next_cursor: null
};

const clients: QueryClient[] = [];

function renderScreen(currentUser: CurrentUser | null = VIEWER) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: 0, retry: false },
      // `retry` comes from useUserProfile; only the delay is removed here.
      queries: { gcTime: Infinity, retryDelay: 0 }
    }
  });
  clients.push(client);
  // Images read the auth token asynchronously; seeding it keeps renders synchronous.
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);
  if (currentUser) {
    client.setQueryData(AUTH_ME_QUERY_KEY, currentUser);
  }

  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <UserProfileScreen />
      </QueryClientProvider>
    </I18nextProvider>
  );

  return client;
}

async function renderProfile(profile: ProfileRead) {
  mockGetUserProfile.mockResolvedValue(profile);
  const client = renderScreen();
  await screen.findByTestId("profile-header");
  return client;
}

function header() {
  return within(screen.getByTestId("profile-header"));
}

function profileTabs() {
  return screen.getAllByTestId(/^profile-tab-/);
}

function tileIds() {
  return screen
    .getAllByTestId(/^recorda-grid-item-/)
    .map((tile) => String(tile.props.testID).replace("recorda-grid-item-", ""));
}

function scrollToEnd() {
  fireEvent.scroll(screen.getByTestId("user-profile-scroll"), {
    nativeEvent: {
      contentOffset: { x: 0, y: 1500 },
      contentSize: { height: 2000, width: 390 },
      layoutMeasurement: { height: 700, width: 390 }
    }
  });
}

function followButton() {
  return screen.getByTestId("follow-button-user-2");
}

beforeEach(() => {
  jest.clearAllMocks();
  // mockReset also drops queued *Once values a failed test may have left behind.
  [
    mockGetUserProfile,
    mockGetUserRecordas,
    mockGetTastes,
    mockGetMetrics,
    mockFollow,
    mockUnfollow,
    mockReportUser
  ].forEach((mock) => mock.mockReset());
  mockGetUserRecordas.mockResolvedValue(GRID_PAGE);
  mockGetTastes.mockResolvedValue({ artists: [], genres: [] });
  mockGetMetrics.mockResolvedValue(METRICS);
  mockRoute = { params: { userId: "user-2" } };
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("UserProfileScreen", () => {
  describe("own profile", () => {
    it("sends the signed-in user to Profile without requesting the profile", () => {
      mockRoute = { params: { userId: VIEWER.user_id } };
      renderScreen();

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("Profile");
      expect(mockGetUserProfile).not.toHaveBeenCalled();
    });

    it("falls back to relationship.is_self when the signed-in user isn't cached", async () => {
      mockGetUserProfile.mockResolvedValue(
        makeProfile({ relationship: { follow_id: null, follow_status: "nenhuma", is_self: true } })
      );
      renderScreen(null);

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("Profile"));
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("profile-header")).toBeNull();
    });
  });

  describe("loading and errors", () => {
    it("shows a loading state while the profile is on its way", () => {
      mockGetUserProfile.mockReturnValue(new Promise(() => undefined));
      renderScreen();

      expect(screen.getByText("Carregando perfil")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Mais opções" })).toBeDisabled();
      expect(mockGetUserProfile).toHaveBeenCalledWith("user-2", expect.any(AbortSignal));
    });

    it("shows an error and retries", async () => {
      // A 500 is retried once by the hook before the error shows.
      mockGetUserProfile
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null))
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null))
        .mockResolvedValueOnce(makeProfile());
      renderScreen();

      expect(await screen.findByText("Não foi possível carregar o perfil.")).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(await screen.findByTestId("profile-header")).toBeTruthy();
      expect(mockGetUserProfile).toHaveBeenCalledTimes(3);
    });

    it("tells a missing profile apart from other errors", async () => {
      mockGetUserProfile.mockRejectedValue(new ApiError("NOT_FOUND", "Not found", 404, null));
      renderScreen();

      expect(await screen.findByText("Este perfil não está disponível.")).toBeTruthy();
      expect(screen.queryByRole("button", { name: "Tentar novamente" })).toBeNull();
      expect(screen.queryByTestId("profile-private-notice")).toBeNull();
    });

    it("never shows a failed request as a private account", async () => {
      mockGetUserProfile.mockRejectedValue(new ApiError("FORBIDDEN", "Forbidden", 403, null));
      renderScreen();

      expect(await screen.findByText("Não foi possível carregar o perfil.")).toBeTruthy();
      expect(screen.queryByText("Esta conta é privada")).toBeNull();
    });
  });

  describe("public profile", () => {
    it("shows identity, music, follow button, counters, tabs and content", async () => {
      await renderProfile(makeProfile());

      expect(header().getByText("Lucas Almeida")).toBeTruthy();
      expect(header().getByText("@lucas_almeida")).toBeTruthy();
      expect(header().getByText("Starlight · Muse")).toBeTruthy();
      expect(within(followButton()).getByText("Seguir")).toBeTruthy();
      expect(screen.getByLabelText("6 Recordas")).toBeTruthy();
      expect(screen.getByLabelText("15 Seguidores")).toBeTruthy();
      expect(screen.getByLabelText("256 Seguindo")).toBeTruthy();
      expect(profileTabs()).toHaveLength(3);
      expect(await screen.findByTestId("recorda-grid")).toBeTruthy();
      expect(screen.queryByTestId("profile-private-notice")).toBeNull();
    });

    it("renders the streak badge when the profile has a streak, without the own-profile hint", async () => {
      await renderProfile(makeProfile({ streak: { current_days: 5, published_today: false } }));

      expect(header().getByText("5 dias de streak")).toBeTruthy();
      expect(screen.queryByTestId("profile-streak-hint")).toBeNull();
    });

    it("titles the top bar with the user's name and goes back", async () => {
      await renderProfile(makeProfile());

      const titles = screen.getAllByText("Lucas Almeida");
      expect(titles).toHaveLength(2);

      fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it("draws the glow behind the layout, centered on the avatar", async () => {
      await renderProfile(makeProfile());

      const glow = screen.getByTestId("profile-glow", { includeHiddenElements: true });
      // Insets are 0 in tests: top bar (56) + avatar center (PROFILE_AVATAR_CENTER_Y) - half
      // the glow (220). It sits outside the ScrollView, so scrolling can't clip it.
      expect(glow).toHaveStyle({ top: 56 + PROFILE_AVATAR_CENTER_Y - 220 });
      expect(within(screen.getByTestId("profile-header")).queryByTestId("profile-glow")).toBeNull();
    });

    it("shows the user's favorite artist and genre chips", async () => {
      mockGetTastes.mockResolvedValue({
        artists: [
          { deezer_id: 27, name: "Daft Punk", picture_url: null },
          { deezer_id: 13, name: "Eminem", picture_url: null }
        ],
        genres: [{ deezer_id: 132, name: "Pop", picture_url: null }]
      });
      await renderProfile(makeProfile());

      expect(mockGetTastes).toHaveBeenCalledWith("user-2", expect.any(AbortSignal));
      expect(await screen.findByTestId("profile-favorite-artist-27")).toBeTruthy();
      expect(screen.getByTestId("profile-favorite-genre-132")).toBeTruthy();
      expect(screen.queryByTestId("profile-favorite-artist-13")).toBeNull();
    });

    it("keeps the header when the chips fail to load", async () => {
      mockGetTastes.mockRejectedValue(new ApiError("SERVER", "Boom", 500, null));
      await renderProfile(makeProfile());

      await waitFor(() => expect(mockGetTastes).toHaveBeenCalledTimes(2));
      expect(screen.getByTestId("profile-favorite-song")).toBeTruthy();
      expect(screen.queryByTestId(/^profile-favorite-artist-/)).toBeNull();
    });

    it("shows the user's metrics on Métricas and keeps 'Em breve' on Calendário", async () => {
      await renderProfile(makeProfile());

      fireEvent.press(screen.getByRole("tab", { name: "Métricas" }));
      expect(screen.getByRole("tab", { name: "Métricas" })).toBeSelected();
      expect(
        await screen.findByText("Este perfil ainda não tem Recordas neste período.")
      ).toBeTruthy();
      expect(mockGetMetrics).toHaveBeenCalledWith(
        "last_30_days",
        expect.any(AbortSignal),
        "user-2"
      );
      expect(screen.queryByTestId("profile-coming-soon-metrics")).toBeNull();

      fireEvent.press(screen.getByRole("tab", { name: "Calendário" }));
      expect(screen.getByRole("tab", { name: "Calendário" })).toBeSelected();
      expect(screen.getByTestId("profile-coming-soon-calendar")).toHaveTextContent("Em breve");
    });

    it("updates the counters and the button after following", async () => {
      mockFollow.mockResolvedValue({ follow_status: "seguindo" });
      mockGetUserProfile.mockResolvedValueOnce(makeProfile()).mockResolvedValueOnce(
        makeProfile({
          counts: { followers: 16, following: 256, recordas: 6 },
          relationship: { follow_id: null, follow_status: "seguindo", is_self: false }
        })
      );
      renderScreen();
      await screen.findByTestId("profile-header");

      fireEvent.press(followButton());

      expect(await screen.findByLabelText("16 Seguidores")).toBeTruthy();
      expect(mockFollow).toHaveBeenCalledWith("user-2");
      expect(within(followButton()).getByText("Seguindo")).toBeTruthy();
      expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
    });
  });

  describe("Recordas grid", () => {
    it("shows the Recordas of a public profile in the backend order", async () => {
      await renderProfile(makeProfile());

      await screen.findByTestId("recorda-grid");
      expect(mockGetUserRecordas).toHaveBeenCalledWith("user-2", null, expect.any(AbortSignal));
      expect(tileIds()).toEqual(["r3", "r2"]);
    });

    it("shows the Recordas of a private profile the viewer follows", async () => {
      await renderProfile(
        makeProfile({
          is_private: true,
          relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
        })
      );

      await screen.findByTestId("recorda-grid");
      expect(tileIds()).toEqual(["r3", "r2"]);
    });

    it("never requests nor shows the Recordas of a private profile without access", async () => {
      const client = await renderProfile(PRIVATE_LOCKED);

      for (const name of ["Recordas", "Métricas", "Calendário"]) {
        fireEvent.press(screen.getByRole("tab", { name }));
        expect(screen.getByTestId("profile-private-notice")).toBeTruthy();
      }
      await act(async () => {
        screen.getByTestId("user-profile-scroll").props.refreshControl.props.onRefresh();
      });
      scrollToEnd();

      expect(mockGetUserRecordas).not.toHaveBeenCalled();
      expect(screen.queryByTestId("recorda-grid")).toBeNull();
      expect(screen.queryByTestId(/^recorda-grid-item-/)).toBeNull();
      expect(client.getQueryData(["profile", "user-2", "recordas"])).toBeUndefined();
    });

    it("hides and drops the Recordas when access is lost", async () => {
      mockUnfollow.mockResolvedValue({ follow_status: "nenhuma" });
      mockGetUserProfile
        .mockResolvedValueOnce(
          makeProfile({
            is_private: true,
            relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
          })
        )
        .mockResolvedValueOnce(PRIVATE_LOCKED);
      const client = renderScreen();
      await screen.findByTestId("recorda-grid");
      expect(client.getQueryData(["profile", "user-2", "recordas"])).toBeDefined();

      fireEvent.press(followButton());
      fireEvent.press(
        within(screen.getByTestId("unfollow-dialog")).getByRole("button", {
          name: "Deixar de seguir"
        })
      );

      expect(await screen.findByTestId("profile-private-notice")).toBeTruthy();
      expect(screen.queryByTestId("recorda-grid")).toBeNull();
      expect(screen.queryByTestId(/^recorda-grid-item-/)).toBeNull();
      expect(client.getQueryData(["profile", "user-2", "recordas"])).toBeUndefined();
      expect(mockGetUserRecordas).toHaveBeenCalledTimes(1);
    });

    it("hides the Recordas as soon as the unfollow starts, before the server answers", async () => {
      let resolveUnfollow: (value: { follow_status: string }) => void = () => undefined;
      mockUnfollow.mockReturnValue(new Promise((resolve) => (resolveUnfollow = resolve)));
      mockGetUserProfile
        .mockResolvedValueOnce(
          makeProfile({
            is_private: true,
            relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
          })
        )
        .mockResolvedValue(PRIVATE_LOCKED);
      renderScreen();
      await screen.findByTestId("recorda-grid");

      fireEvent.press(followButton());
      fireEvent.press(
        within(screen.getByTestId("unfollow-dialog")).getByRole("button", {
          name: "Deixar de seguir"
        })
      );

      // The request is still pending: no Recorda may stay on screen meanwhile.
      expect(await screen.findByTestId("profile-private-notice")).toBeTruthy();
      expect(screen.queryByTestId(/^recorda-grid-item-/)).toBeNull();
      expect(screen.queryByTestId("profile-counts")).toBeNull();
      await act(async () => resolveUnfollow({ follow_status: "nenhuma" }));
    });

    it("brings the Recordas back when the unfollow fails", async () => {
      const followed = makeProfile({
        is_private: true,
        relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
      });
      let rejectUnfollow: (reason: unknown) => void = () => undefined;
      mockUnfollow.mockReturnValue(new Promise((_resolve, reject) => (rejectUnfollow = reject)));
      mockGetUserProfile.mockResolvedValue(followed);
      const client = renderScreen();
      await screen.findByTestId("recorda-grid");

      fireEvent.press(followButton());
      fireEvent.press(
        within(screen.getByTestId("unfollow-dialog")).getByRole("button", {
          name: "Deixar de seguir"
        })
      );
      await screen.findByTestId("profile-private-notice");
      expect(client.getQueryData(["profile", "user-2", "recordas"])).toBeUndefined();

      await act(async () => rejectUnfollow(new Error("offline")));

      // Still following: the content comes back, reloaded since the cache was dropped.
      await waitFor(() => expect(mockGetUserRecordas).toHaveBeenCalledTimes(2));
      expect(await screen.findByTestId("recorda-grid")).toBeTruthy();
      expect(tileIds()).toEqual(["r3", "r2"]);
      expect(screen.queryByTestId("profile-private-notice")).toBeNull();
      expect(screen.getByTestId("profile-counts")).toBeTruthy();
    });

    it("loads the Recordas again when access is granted", async () => {
      await renderProfile(PRIVATE_LOCKED);
      mockGetUserProfile.mockReset();
      mockGetUserProfile.mockResolvedValue(
        makeProfile({
          is_private: true,
          relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
        })
      );
      expect(mockGetUserRecordas).not.toHaveBeenCalled();

      // E.g. the request was accepted meanwhile and the user pulls to refresh.
      await act(async () => {
        screen.getByTestId("user-profile-scroll").props.refreshControl.props.onRefresh();
      });

      expect(await screen.findByTestId("recorda-grid")).toBeTruthy();
      expect(mockGetUserRecordas).toHaveBeenCalledWith("user-2", null, expect.any(AbortSignal));
      expect(tileIds()).toEqual(["r3", "r2"]);
    });

    it("drops only this profile's restricted data from the cache when access is lost", async () => {
      mockUnfollow.mockResolvedValue({ follow_status: "nenhuma" });
      mockGetUserProfile
        .mockResolvedValueOnce(
          makeProfile({
            is_private: true,
            relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
          })
        )
        .mockResolvedValue(PRIVATE_LOCKED);
      const client = renderScreen();
      const otherGrid = { pageParams: [null], pages: [GRID_PAGE] };
      client.setQueryData(["profile", "user-3", "recordas"], otherGrid);
      client.setQueryData(["profile", VIEWER.user_id, "recordas"], otherGrid);
      client.setQueryData(["user-metrics", "profile", "user-2", "last_30_days"], METRICS);
      client.setQueryData(["user-metrics", "profile", "user-3", "last_30_days"], METRICS);
      await screen.findByTestId("recorda-grid");
      await waitFor(() =>
        expect(client.getQueryData(["profile", "user-2", "music-tastes"])).toBeDefined()
      );

      fireEvent.press(followButton());
      fireEvent.press(
        within(screen.getByTestId("unfollow-dialog")).getByRole("button", {
          name: "Deixar de seguir"
        })
      );
      await screen.findByTestId("profile-private-notice");

      await waitFor(() =>
        expect(client.getQueryData(["profile", "user-2", "recordas"])).toBeUndefined()
      );
      expect(client.getQueryData(["profile", "user-3", "recordas"])).toEqual(otherGrid);
      expect(client.getQueryData(["profile", VIEWER.user_id, "recordas"])).toEqual(otherGrid);
      expect(client.getQueryData(["profile", "user-2", "music-tastes"])).toBeUndefined();
      expect(
        client.getQueryData(["user-metrics", "profile", "user-2", "last_30_days"])
      ).toBeUndefined();
      expect(client.getQueryData(["user-metrics", "profile", "user-3", "last_30_days"])).toEqual(
        METRICS
      );
    });

    it("shows the empty state for a profile without Recordas", async () => {
      mockGetUserRecordas.mockResolvedValue({ items: [], next_cursor: null });
      await renderProfile(makeProfile());

      expect(await screen.findByText("Nenhuma Recorda publicada ainda.")).toBeTruthy();
    });

    it("shows a grid error and retries", async () => {
      // A 500 is retried once by the hook before the error shows.
      mockGetUserRecordas
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null))
        .mockRejectedValueOnce(new ApiError("SERVER", "Boom", 500, null))
        .mockResolvedValueOnce(GRID_PAGE);
      await renderProfile(makeProfile());

      expect(await screen.findByText("Não foi possível carregar as Recordas.")).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(await screen.findByTestId("recorda-grid")).toBeTruthy();
      expect(tileIds()).toEqual(["r3", "r2"]);
    });

    it("requests the next page near the end of the scroll, once at a time", async () => {
      let resolveNext: (page: RecordaGridPage) => void = () => undefined;
      mockGetUserRecordas
        .mockResolvedValueOnce({ ...GRID_PAGE, next_cursor: "cursor-2" })
        .mockReturnValueOnce(new Promise((resolve) => (resolveNext = resolve)));
      await renderProfile(makeProfile());
      await screen.findByTestId("recorda-grid");

      scrollToEnd();
      await waitFor(() => expect(mockGetUserRecordas).toHaveBeenCalledTimes(2));
      expect(mockGetUserRecordas).toHaveBeenLastCalledWith(
        "user-2",
        "cursor-2",
        expect.any(AbortSignal)
      );
      scrollToEnd();
      expect(mockGetUserRecordas).toHaveBeenCalledTimes(2);

      await act(async () =>
        resolveNext({ items: [gridItem("r1", "2026-10-25T12:00:00Z")], next_cursor: null })
      );
      await waitFor(() => expect(tileIds()).toEqual(["r3", "r2", "r1"]));
    });

    it("refreshes profile and grid on pull to refresh", async () => {
      await renderProfile(makeProfile());
      await screen.findByTestId("recorda-grid");
      const profileCalls = mockGetUserProfile.mock.calls.length;
      const gridCalls = mockGetUserRecordas.mock.calls.length;

      await act(async () => {
        screen.getByTestId("user-profile-scroll").props.refreshControl.props.onRefresh();
      });

      await waitFor(() => expect(mockGetUserProfile.mock.calls.length).toBe(profileCalls + 1));
      expect(mockGetUserRecordas.mock.calls.length).toBe(gridCalls + 1);
    });

    it("opens a Recorda's details", async () => {
      await renderProfile(makeProfile());

      fireEvent.press(await screen.findByTestId("recorda-grid-item-r2"));

      expect(mockNavigate).toHaveBeenCalledWith("PublishedRecorda", { postId: "r2" });
    });
  });

  describe("private profile without access", () => {
    it("keeps identity, music and the follow button but hides counters and content", async () => {
      await renderProfile(PRIVATE_LOCKED);

      expect(header().getByText("Lucas Almeida")).toBeTruthy();
      expect(header().getByText("@lucas_almeida")).toBeTruthy();
      expect(header().getByText("Starlight · Muse")).toBeTruthy();
      expect(within(followButton()).getByText("Seguir")).toBeTruthy();
      expect(screen.queryByTestId("profile-counts")).toBeNull();
      expect(screen.queryByTestId("recorda-grid")).toBeNull();
      expect(screen.getByText("Esta conta é privada")).toBeTruthy();
    });

    it("keeps the three tab labels and the notice on every tab", async () => {
      await renderProfile(PRIVATE_LOCKED);

      for (const name of ["Recordas", "Métricas", "Calendário"]) {
        fireEvent.press(screen.getByRole("tab", { name }));
        expect(profileTabs()).toHaveLength(3);
        expect(screen.getByTestId("profile-private-notice")).toBeTruthy();
        expect(screen.queryByText("Em breve")).toBeNull();
      }
    });

    it("requests neither the chips nor the metrics without access", async () => {
      await renderProfile(PRIVATE_LOCKED);
      fireEvent.press(screen.getByRole("tab", { name: "Métricas" }));

      expect(mockGetTastes).not.toHaveBeenCalled();
      expect(mockGetMetrics).not.toHaveBeenCalled();
    });

    it("hides counters even if the backend sends them without access", async () => {
      await renderProfile(makeProfile({ can_view_content: false, is_private: true }));

      expect(screen.queryByTestId("profile-counts")).toBeNull();
      expect(screen.getByTestId("profile-private-notice")).toBeTruthy();
    });
  });

  describe("private profile with access", () => {
    it("shows counters and content to an accepted follower", async () => {
      await renderProfile(
        makeProfile({
          is_private: true,
          relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
        })
      );

      expect(screen.getByTestId("profile-counts")).toBeTruthy();
      expect(await screen.findByTestId("recorda-grid")).toBeTruthy();
      expect(screen.queryByTestId("profile-private-notice")).toBeNull();
      expect(within(followButton()).getByText("Seguindo")).toBeTruthy();
    });
  });

  describe("pending request", () => {
    it("shows Solicitado, keeps the content locked and cancels without confirmation", async () => {
      mockUnfollow.mockResolvedValue({ follow_status: "nenhuma" });
      mockGetUserProfile.mockResolvedValueOnce(
        makeProfile({
          can_view_content: false,
          counts: null,
          is_private: true,
          relationship: { follow_id: "follow-1", follow_status: "solicitado", is_self: false }
        })
      );
      mockGetUserProfile.mockResolvedValueOnce(PRIVATE_LOCKED);
      renderScreen();
      await screen.findByTestId("profile-header");

      expect(within(followButton()).getByText("Solicitado")).toBeTruthy();
      expect(screen.getByTestId("profile-private-notice")).toBeTruthy();
      expect(profileTabs()).toHaveLength(3);

      fireEvent.press(followButton());

      expect(screen.queryByTestId("unfollow-dialog")).toBeNull();
      await waitFor(() => expect(within(followButton()).getByText("Seguir")).toBeTruthy());
      expect(mockUnfollow).toHaveBeenCalledWith("user-2");
      expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
    });
  });

  describe("following", () => {
    it("asks for confirmation before unfollowing and then refreshes the profile", async () => {
      mockUnfollow.mockResolvedValue({ follow_status: "nenhuma" });
      mockGetUserProfile
        .mockResolvedValueOnce(
          makeProfile({
            relationship: { follow_id: "follow-1", follow_status: "seguindo", is_self: false }
          })
        )
        .mockResolvedValueOnce(makeProfile());
      renderScreen();
      await screen.findByTestId("profile-header");

      fireEvent.press(followButton());

      expect(mockUnfollow).not.toHaveBeenCalled();
      const dialog = within(screen.getByTestId("unfollow-dialog"));
      expect(
        dialog.getByText("Tem certeza que deseja deixar de seguir lucas_almeida?")
      ).toBeTruthy();
      fireEvent.press(dialog.getByRole("button", { name: "Deixar de seguir" }));

      await waitFor(() => expect(within(followButton()).getByText("Seguir")).toBeTruthy());
      expect(screen.queryByTestId("unfollow-dialog")).toBeNull();
      expect(mockUnfollow).toHaveBeenCalledWith("user-2");
      expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
    });
  });

  describe("report", () => {
    it("reports the profile through the shared report dialog", async () => {
      mockReportUser.mockResolvedValue({
        created_at: "2026-10-19T12:00:00Z",
        report_id: "report-1",
        status: "OPEN"
      });
      await renderProfile(makeProfile());

      fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
      const menu = within(screen.getByTestId("profile-menu"));
      expect(menu.getAllByRole("button")).toHaveLength(1);
      fireEvent.press(menu.getByRole("button", { name: "Denunciar perfil" }));

      expect(screen.queryByTestId("profile-menu")).toBeNull();
      const description = screen.getByLabelText("Descrição (opcional)");
      expect(description.props.maxLength).toBe(500);
      fireEvent.changeText(description, "Spam");
      fireEvent.press(screen.getByRole("button", { name: "Denunciar" }));

      await waitFor(() => expect(mockReportUser).toHaveBeenCalledWith("user-2", "Spam"));
      expect(
        await screen.findByText("Denúncia enviada. Obrigado por ajudar a comunidade.")
      ).toBeTruthy();
    });

    it("keeps the existing duplicate-report message", async () => {
      mockReportUser.mockRejectedValue(new ApiError("CONFLICT", "Duplicate", 409, null));
      await renderProfile(makeProfile());

      fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
      fireEvent.press(screen.getByRole("button", { name: "Denunciar perfil" }));
      fireEvent.press(screen.getByRole("button", { name: "Denunciar" }));

      expect(await screen.findByText("Você já denunciou este conteúdo.")).toBeTruthy();
    });

    it("closes the menu on a tap outside it", async () => {
      await renderProfile(makeProfile());

      fireEvent.press(screen.getByRole("button", { name: "Mais opções" }));
      fireEvent.press(screen.getByTestId("profile-menu-backdrop"));

      expect(screen.queryByTestId("profile-menu")).toBeNull();
      expect(mockReportUser).not.toHaveBeenCalled();
    });
  });

  it("navigates from the bottom tab bar", async () => {
    await renderProfile(makeProfile());

    fireEvent.press(screen.getByRole("tab", { name: "Criar Recorda" }));
    fireEvent.press(screen.getByRole("tab", { name: "Feed" }));
    fireEvent.press(screen.getByRole("tab", { name: "Perfil" }));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "Camera");
    expect(mockNavigate).toHaveBeenNthCalledWith(2, "Feed");
    expect(mockNavigate).toHaveBeenNthCalledWith(3, "Profile");
  });
});
