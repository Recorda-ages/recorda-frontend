import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import type { ComponentProps, ReactElement } from "react";
import { Text } from "react-native";
import { I18nextProvider } from "react-i18next";

import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfilePrivateNotice } from "@/features/profile/components/ProfilePrivateNotice";
import { ProfileTabs } from "@/features/profile/components/ProfileTabs";
import { mockOpenProfile } from "@/features/profile/mocks/profileMocks";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";
import { colors } from "@/theme";

import { mockAudioPlayer, resetAudioMock } from "../../mocks/expoAudio";

type HostChild = ReturnType<typeof screen.getByTestId> | string;

function renderWithProviders(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  // Images read the auth token asynchronously; seeding it keeps renders synchronous.
  queryClient.setQueryData(AUTH_TOKEN_QUERY_KEY, null);

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
    </I18nextProvider>
  );
}

const HEADER_PROPS: ComponentProps<typeof ProfileHeader> = {
  avatarUrl: "https://cdn.example.com/lucas.jpg",
  favoriteSong: {
    artistName: "Muse",
    coverUrl: "https://cdn.example.com/starlight.jpg",
    title: "Starlight"
  },
  name: "Lucas Almeida",
  username: "lucas_almeida"
};

function renderHeader(props: Partial<ComponentProps<typeof ProfileHeader>> = {}) {
  return renderWithProviders(<ProfileHeader {...HEADER_PROPS} {...props} />);
}

describe("ProfileHeader", () => {
  it("shows the name and the username", () => {
    renderHeader();

    expect(screen.getByText("Lucas Almeida")).toBeTruthy();
    expect(screen.getByText("@lucas_almeida")).toBeTruthy();
  });

  it("shows the avatar picture when there is one", () => {
    renderHeader();

    expect(screen.getByTestId("profile-avatar")).toBeTruthy();
    expect(screen.getByLabelText("Foto de perfil de Lucas Almeida")).toBeTruthy();
    expect(screen.queryByTestId("profile-avatar-fallback")).toBeNull();
  });

  it("falls back to a placeholder avatar without a picture", () => {
    renderHeader({ avatarUrl: null });

    expect(screen.getByTestId("profile-avatar-fallback")).toBeTruthy();
    expect(screen.queryByTestId("profile-avatar")).toBeNull();
  });

  it("shows the favorite song with title and artist", () => {
    renderHeader();

    expect(screen.getByText("Starlight · Muse")).toBeTruthy();
    expect(screen.getByLabelText("Música favorita: Starlight, de Muse")).toBeTruthy();
  });

  it("keeps the music chips on their regular background", () => {
    renderHeader();

    expect(screen.getByTestId("profile-favorite-song")).toHaveStyle({
      backgroundColor: colors.secondary[900]
    });
  });

  it("keeps the favorite song chip when the cover is missing", () => {
    renderHeader({ favoriteSong: { artistName: "Muse", coverUrl: "", title: "Starlight" } });

    expect(screen.getByText("Starlight · Muse")).toBeTruthy();
  });

  it("omits the favorite song when there is none", () => {
    renderHeader({ favoriteSong: null });

    expect(screen.queryByTestId("profile-favorite-song")).toBeNull();
  });

  it("shows the counters with singular and plural labels", () => {
    renderHeader({ counts: { followers: 1, following: 256, recordas: 6 } });

    expect(screen.getByLabelText("6 Recordas")).toBeTruthy();
    expect(screen.getByLabelText("1 Seguidor")).toBeTruthy();
    expect(screen.getByLabelText("256 Seguindo")).toBeTruthy();
  });

  it.each([
    ["absent", undefined],
    ["null", null]
  ])("hides the counters when counts is %s", (_case, counts) => {
    renderHeader({ counts });

    expect(screen.queryByTestId("profile-counts")).toBeNull();
    expect(screen.queryByText("Seguidores")).toBeNull();
  });

  it("renders the headerRight slot in the top-right corner", () => {
    renderHeader({
      headerRight: <Text>Engrenagem</Text>,
      name: mockOpenProfile.name,
      username: mockOpenProfile.username
    });

    expect(within(screen.getByTestId("profile-header-right")).getByText("Engrenagem")).toBeTruthy();
    expect(screen.getByText(mockOpenProfile.name)).toBeTruthy();
  });

  it("omits the headerRight area without the slot", () => {
    renderHeader();

    expect(screen.queryByTestId("profile-header-right")).toBeNull();
  });

  it("renders the action slot", () => {
    renderHeader({ actionSlot: <Text>Ação</Text> });

    expect(screen.getByText("Ação")).toBeTruthy();
  });

  it("renders the streak slot as the first cell of the information grid", () => {
    renderHeader({
      favoriteArtists: [{ id: 7, name: "Muse" }],
      streakSlot: <Text testID="streak-slot">Sequência</Text>
    });

    // Direct children of the grid, identified by their testID.
    const order = screen
      .getByTestId("profile-chips")
      .children.map((child: HostChild) =>
        typeof child === "string" ? child : String(child.props.testID)
      );

    expect(order).toEqual(["streak-slot", "profile-favorite-song", "profile-favorite-artist-7"]);
  });

  it("renders the streak hint slot below the information grid", () => {
    renderHeader({
      actionSlot: <Text testID="action-slot">Ação</Text>,
      streakHintSlot: <Text testID="streak-hint-slot">Dica</Text>
    });

    // Direct children of the header, identified by their testID.
    const order = screen
      .getByTestId("profile-header")
      .children.map((child: HostChild) =>
        typeof child === "string" ? child : String(child.props.testID ?? "")
      );
    const chipsIndex = order.indexOf("profile-chips");

    expect(chipsIndex).toBeGreaterThan(-1);
    expect(order[chipsIndex + 1]).toBe("streak-hint-slot");
    expect(within(screen.getByTestId("profile-chips")).queryByText("Dica")).toBeNull();
  });

  it("shows the information grid with only the streak slot", () => {
    renderHeader({ favoriteSong: null, streakSlot: <Text testID="streak-slot">Sequência</Text> });

    expect(within(screen.getByTestId("profile-chips")).getByTestId("streak-slot")).toBeTruthy();
  });

  it("keeps the avatar read-only without onEditAvatar", () => {
    renderHeader();

    expect(screen.queryByTestId("profile-edit-avatar")).toBeNull();
    expect(screen.queryByLabelText("Alterar foto de perfil")).toBeNull();
    expect(screen.queryByTestId("profile-edit-avatar-icon")).toBeNull();
  });

  it("shows the edit icon next to the photo with onEditAvatar", () => {
    renderHeader({ onEditAvatar: jest.fn() });

    expect(
      within(screen.getByTestId("profile-edit-avatar")).getByTestId("profile-edit-avatar-icon")
    ).toBeTruthy();
  });

  it("makes the avatar pressable with onEditAvatar", () => {
    const onEditAvatar = jest.fn();
    renderHeader({ onEditAvatar });

    fireEvent.press(screen.getByRole("button", { name: "Alterar foto de perfil" }));

    expect(onEditAvatar).toHaveBeenCalledTimes(1);
  });

  describe("favorite artists and genres", () => {
    const ARTISTS = [
      { id: 412, name: "Imagine Dragons", pictureUrl: "https://cdn.example.com/dragons.jpg" },
      { id: 7, name: "Muse" }
    ];
    const GENRES = [
      { id: 85, name: "Indie Rock", pictureUrl: "https://cdn.example.com/indie.jpg" },
      { id: 152, name: "Rock" }
    ];

    it("shows a chip per artist and per genre, next to the favorite song", () => {
      renderHeader({ favoriteArtists: ARTISTS, favoriteGenres: GENRES });

      expect(screen.getByText("Starlight · Muse")).toBeTruthy();
      expect(screen.getByLabelText("Artista favorito: Imagine Dragons")).toBeTruthy();
      expect(screen.getByLabelText("Artista favorito: Muse")).toBeTruthy();
      expect(screen.getByLabelText("Gênero favorito: Indie Rock")).toBeTruthy();
      expect(screen.getByLabelText("Gênero favorito: Rock")).toBeTruthy();
    });

    it("uses the artist picture when there is one, and an icon otherwise", () => {
      renderHeader({ favoriteArtists: ARTISTS });

      expect(screen.getByTestId("profile-favorite-artist-412-image")).toHaveProp("source", [
        { uri: "https://cdn.example.com/dragons.jpg" }
      ]);
      expect(screen.queryByTestId("profile-favorite-artist-7-image")).toBeNull();
    });

    it("shows genres with the icon, as in the visual reference", () => {
      renderHeader({ favoriteGenres: GENRES });

      expect(screen.queryByTestId("profile-favorite-genre-85-image")).toBeNull();
    });

    it("keeps long names on one line, ending in an ellipsis", () => {
      const longName = "The Extraordinarily Long Named Orchestra Of Everything";
      renderHeader({ favoriteArtists: [{ id: 1, name: longName }] });

      expect(screen.getByText(longName)).toHaveProp("numberOfLines", 1);
    });

    it("renders no artist or genre chips when they are not given", () => {
      renderHeader();

      expect(screen.queryByTestId(/^profile-favorite-artist-\d+$/)).toBeNull();
      expect(screen.queryByTestId(/^profile-favorite-genre-\d+$/)).toBeNull();
      expect(screen.getByTestId("profile-favorite-song")).toBeTruthy();
    });

    it("shows the artist and genre chips even without a favorite song", () => {
      renderHeader({ favoriteArtists: ARTISTS, favoriteGenres: [], favoriteSong: null });

      expect(screen.queryByTestId("profile-favorite-song")).toBeNull();
      expect(screen.getAllByTestId(/^profile-favorite-artist-\d+$/)).toHaveLength(2);
    });
  });

  describe("counters", () => {
    const COUNTS = { followers: 15, following: 256, recordas: 6 };

    it("opens the followers and following lists when the screen passes callbacks", () => {
      const onPressFollowers = jest.fn();
      const onPressFollowing = jest.fn();
      renderHeader({ counts: COUNTS, onPressFollowers, onPressFollowing });

      fireEvent.press(screen.getByRole("button", { name: "15 Seguidores" }));
      fireEvent.press(screen.getByRole("button", { name: "256 Seguindo" }));

      expect(onPressFollowers).toHaveBeenCalledTimes(1);
      expect(onPressFollowing).toHaveBeenCalledTimes(1);
    });

    it("describes where the pressable counters lead", () => {
      renderHeader({ counts: COUNTS, onPressFollowers: jest.fn(), onPressFollowing: jest.fn() });

      expect(screen.getByTestId("profile-count-followers")).toHaveProp(
        "accessibilityHint",
        "Abre a lista de seguidores"
      );
      expect(screen.getByTestId("profile-count-following")).toHaveProp(
        "accessibilityHint",
        "Abre a lista de quem você segue"
      );
    });

    it("keeps the Recordas counter static", () => {
      renderHeader({ counts: COUNTS, onPressFollowers: jest.fn(), onPressFollowing: jest.fn() });

      expect(screen.queryByRole("button", { name: "6 Recordas" })).toBeNull();
      expect(screen.getByLabelText("6 Recordas")).toBeTruthy();
    });

    it("keeps the counters static without callbacks", () => {
      renderHeader({ counts: COUNTS });

      expect(screen.queryByRole("button", { name: "15 Seguidores" })).toBeNull();
      expect(screen.queryByRole("button", { name: "256 Seguindo" })).toBeNull();
      expect(screen.getByLabelText("15 Seguidores")).toBeTruthy();
    });
  });
});

describe("ProfileHeader favorite song playback", () => {
  const withPreview = {
    favoriteSong: {
      artistName: "Muse",
      coverUrl: "https://cdn.example.com/starlight.jpg",
      previewUrl: "https://cdn.example.com/preview.mp3",
      title: "Starlight"
    }
  };

  beforeEach(() => {
    resetAudioMock();
  });

  it("plays the preview when the song chip is pressed and pauses on a second press", async () => {
    renderHeader(withPreview);
    const chip = screen.getByTestId("profile-favorite-song");

    fireEvent.press(chip);

    await waitFor(() => expect(mockAudioPlayer.play).toHaveBeenCalledTimes(1));
    expect(mockAudioPlayer.replace).toHaveBeenCalledWith("https://cdn.example.com/preview.mp3");
    expect(mockAudioPlayer.loop).toBe(true);
    expect(screen.getByTestId("profile-favorite-song")).toBeSelected();

    mockAudioPlayer.pause.mockClear();
    fireEvent.press(screen.getByTestId("profile-favorite-song"));

    await waitFor(() => expect(mockAudioPlayer.pause).toHaveBeenCalled());
    expect(screen.getByTestId("profile-favorite-song")).not.toBeSelected();
  });

  it("stops the preview when the stop token changes", async () => {
    const { rerender } = renderHeader({ ...withPreview, songStopToken: 0 });
    fireEvent.press(screen.getByTestId("profile-favorite-song"));
    await waitFor(() => expect(mockAudioPlayer.play).toHaveBeenCalled());
    mockAudioPlayer.pause.mockClear();

    rerender(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient()}>
          <ProfileHeader {...HEADER_PROPS} {...withPreview} songStopToken={1} />
        </QueryClientProvider>
      </I18nextProvider>
    );

    await waitFor(() => expect(mockAudioPlayer.pause).toHaveBeenCalled());
  });

  it("is not pressable when the song has no preview", () => {
    renderHeader();

    fireEvent.press(screen.getByTestId("profile-favorite-song"));

    expect(mockAudioPlayer.play).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Música favorita/ })).toBeNull();
  });
});

describe("ProfileTabs", () => {
  it("shows the three tabs", () => {
    renderWithProviders(<ProfileTabs activeTab="recordas" onChange={jest.fn()} />);

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Recordas" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Métricas" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Calendário" })).toBeTruthy();
  });

  it("marks only the active tab as selected", () => {
    renderWithProviders(<ProfileTabs activeTab="metrics" onChange={jest.fn()} />);

    expect(screen.getByRole("tab", { name: "Métricas" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "Recordas" })).not.toBeSelected();
    expect(screen.getByRole("tab", { name: "Calendário" })).not.toBeSelected();
  });

  it("reports the pressed tab", () => {
    const onChange = jest.fn();
    renderWithProviders(<ProfileTabs activeTab="recordas" onChange={onChange} />);

    fireEvent.press(screen.getByRole("tab", { name: "Calendário" }));
    fireEvent.press(screen.getByRole("tab", { name: "Métricas" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "calendar");
    expect(onChange).toHaveBeenNthCalledWith(2, "metrics");
  });

  it("renders metricsContent and calendarContent under their tabs", () => {
    const tabs = (activeTab: "metrics" | "calendar") => (
      <ProfileTabs
        activeTab={activeTab}
        calendarContent={<Text>Calendário do E7</Text>}
        metricsContent={<Text>Métricas do E7</Text>}
        onChange={jest.fn()}
      />
    );
    const { rerender } = renderWithProviders(tabs("metrics"));

    expect(screen.getByText("Métricas do E7")).toBeTruthy();
    expect(screen.queryByText("Calendário do E7")).toBeNull();

    rerender(<I18nextProvider i18n={i18n}>{tabs("calendar")}</I18nextProvider>);

    expect(screen.getByText("Calendário do E7")).toBeTruthy();
    expect(screen.queryByText("Métricas do E7")).toBeNull();
  });

  it("renders recordasContent under the Recordas tab and swaps it when the tab changes", () => {
    const tabs = (activeTab: "recordas" | "metrics") => (
      <ProfileTabs
        activeTab={activeTab}
        metricsContent={<Text>Métricas do E7</Text>}
        onChange={jest.fn()}
        recordasContent={<Text>Grade de Recordas</Text>}
      />
    );
    const { rerender } = renderWithProviders(tabs("recordas"));

    expect(screen.getByText("Grade de Recordas")).toBeTruthy();
    expect(screen.queryByText("Métricas do E7")).toBeNull();

    rerender(<I18nextProvider i18n={i18n}>{tabs("metrics")}</I18nextProvider>);

    expect(screen.getByText("Métricas do E7")).toBeTruthy();
    expect(screen.queryByText("Grade de Recordas")).toBeNull();
  });

  it("draws a fill indicator per tab like the feed tabs", () => {
    renderWithProviders(<ProfileTabs activeTab="metrics" onChange={jest.fn()} />);

    expect(screen.getByTestId("profile-tabfill-recordas")).toBeTruthy();
    expect(screen.getByTestId("profile-tabfill-metrics")).toBeTruthy();
    expect(screen.getByTestId("profile-tabfill-calendar")).toBeTruthy();
  });

  it("shows a translated empty state while a slot is not filled", () => {
    renderWithProviders(<ProfileTabs activeTab="calendar" onChange={jest.fn()} />);

    expect(screen.getByTestId("profile-coming-soon-calendar")).toHaveTextContent("Em breve");
  });

  it("leaves the Recordas tab content to the screen", () => {
    renderWithProviders(
      <ProfileTabs
        activeTab="recordas"
        metricsContent={<Text>Métricas do E7</Text>}
        onChange={jest.fn()}
      />
    );

    expect(screen.queryByText("Métricas do E7")).toBeNull();
    expect(screen.queryByTestId("profile-coming-soon-recordas")).toBeNull();
  });
});

describe("ProfilePrivateNotice", () => {
  it("shows the lock and the private account message", () => {
    renderWithProviders(<ProfilePrivateNotice />);

    // Decorative, so hidden from screen readers.
    expect(
      screen.getByTestId("profile-private-notice-icon", { includeHiddenElements: true })
    ).toBeTruthy();
    expect(screen.getByText("Esta conta é privada")).toBeTruthy();
    expect(screen.getByText("Siga este perfil para ver suas Recordas.")).toBeTruthy();
  });
});
