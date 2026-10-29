import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps, ReactElement } from "react";
import { Text } from "react-native";
import { I18nextProvider } from "react-i18next";

import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfilePrivateNotice } from "@/features/profile/components/ProfilePrivateNotice";
import { ProfileTabs } from "@/features/profile/components/ProfileTabs";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";

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

  it("renders the action slot", () => {
    renderHeader({ actionSlot: <Text>Ação</Text> });

    expect(screen.getByText("Ação")).toBeTruthy();
  });

  it("keeps the avatar read-only without onEditAvatar", () => {
    renderHeader();

    expect(screen.queryByTestId("profile-edit-avatar")).toBeNull();
    expect(screen.queryByLabelText("Alterar foto de perfil")).toBeNull();
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
