import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { followService } from "@/features/follow/services/followService";
import { reportService } from "@/features/moderation/services/reportService";
import { PROFILE_AVATAR_CENTER_Y, UserProfileScreen } from "@/features/profile";
import { profileService } from "@/features/profile/services/profileService";
import type { ProfileRead } from "@/features/profile/types";
import { i18n } from "@/i18n";
import { ApiError, AUTH_TOKEN_QUERY_KEY } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: { getUserProfile: jest.fn() }
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

const PRIVATE_LOCKED = makeProfile({ can_view_content: false, counts: null, is_private: true });

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

function followButton() {
  return screen.getByTestId("follow-button-user-2");
}

beforeEach(() => {
  jest.clearAllMocks();
  // mockReset also drops queued *Once values a failed test may have left behind.
  [mockGetUserProfile, mockFollow, mockUnfollow, mockReportUser].forEach((mock) =>
    mock.mockReset()
  );
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
      expect(screen.getByTestId("profile-coming-soon-recordas")).toBeTruthy();
      expect(screen.queryByTestId("profile-private-notice")).toBeNull();
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

    it("shows 'Em breve' on each tab while the content isn't available", async () => {
      await renderProfile(makeProfile());

      fireEvent.press(screen.getByRole("tab", { name: "Métricas" }));
      expect(screen.getByRole("tab", { name: "Métricas" })).toBeSelected();
      expect(screen.getByTestId("profile-coming-soon-metrics")).toHaveTextContent("Em breve");

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

  describe("private profile without access", () => {
    it("keeps identity, music and the follow button but hides counters and content", async () => {
      await renderProfile(PRIVATE_LOCKED);

      expect(header().getByText("Lucas Almeida")).toBeTruthy();
      expect(header().getByText("@lucas_almeida")).toBeTruthy();
      expect(header().getByText("Starlight · Muse")).toBeTruthy();
      expect(within(followButton()).getByText("Seguir")).toBeTruthy();
      expect(screen.queryByTestId("profile-counts")).toBeNull();
      expect(screen.queryByTestId("profile-coming-soon-recordas")).toBeNull();
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
      expect(screen.getByTestId("profile-coming-soon-recordas")).toBeTruthy();
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
