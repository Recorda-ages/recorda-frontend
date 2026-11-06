import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { useArtistSearch } from "@/features/music/hooks/useArtistSearch";
import { usePopularArtists } from "@/features/music/hooks/usePopularArtists";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import type { MusicSelection } from "@/features/onboarding";
import { i18n } from "@/i18n";

jest.mock("@/features/music/hooks/useArtistSearch", () => ({
  useArtistSearch: jest.fn()
}));
jest.mock("@/features/music/hooks/usePopularArtists", () => ({
  usePopularArtists: jest.fn()
}));

const popularArtists = [
  { id: 101, name: "Anitta", picture_url: null },
  { id: 102, name: "Djavan", picture_url: null },
  { id: 103, name: "Marisa Monte", picture_url: null }
];
const searchArtists = [
  { id: 1, name: "Legião Urbana", picture_url: null },
  { id: 2, name: "Tribalistas", picture_url: null },
  { id: 3, name: "Toquinho", picture_url: null }
];
const mockUseArtistSearch = jest.mocked(useArtistSearch);
const mockUsePopularArtists = jest.mocked(usePopularArtists);

function renderScreen(initialArtists: MusicSelection[] = []) {
  const onBack = jest.fn();
  const onContinue = jest.fn();

  function ControlledScreen() {
    const [selectedArtists, setSelectedArtists] = useState<MusicSelection[]>(initialArtists);

    return (
      <OnboardingArtistsScreen
        onBack={onBack}
        onContinue={onContinue}
        onSelectedArtistsChange={setSelectedArtists}
        selectedArtists={selectedArtists}
      />
    );
  }

  render(
    <I18nextProvider i18n={i18n}>
      <ControlledScreen />
    </I18nextProvider>
  );

  return { onBack, onContinue };
}

describe("OnboardingArtistsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseArtistSearch.mockImplementation(
      (query) =>
        ({
          data: query ? searchArtists : undefined,
          isError: false,
          isFetching: false,
          isSuccess: query.length > 0
        }) as ReturnType<typeof useArtistSearch>
    );
    mockUsePopularArtists.mockReturnValue({
      data: popularArtists,
      isError: false,
      isPending: false
    } as ReturnType<typeof usePopularArtists>);
  });

  it("shows popular artists by default before any search", () => {
    renderScreen();

    expect(screen.getByText("Anitta")).toBeTruthy();
    expect(screen.getByText("Djavan")).toBeTruthy();
    expect(screen.getByText("Marisa Monte")).toBeTruthy();
    expect(mockUseArtistSearch).toHaveBeenCalledWith("");
  });

  it("shows an error state when popular artists fail to load", () => {
    mockUsePopularArtists.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false
    } as ReturnType<typeof usePopularArtists>);
    renderScreen();

    expect(screen.getByText("Não foi possível carregar artistas populares.")).toBeTruthy();
  });

  it("renders the artist search step and its minimum selection rule", () => {
    renderScreen();

    expect(screen.getByTestId("onboarding-artists-screen")).toBeTruthy();
    expect(screen.getByText("Artistas")).toBeTruthy();
    expect(screen.getByText("ETAPA 1 DE 3")).toBeTruthy();
    expect(screen.getByText("Quem faz parte da sua história?")).toBeTruthy();
    expect(
      screen.getByText("Escolha pelo menos 3 artistas para personalizar suas recordações.")
    ).toBeTruthy();
    expect(screen.getByLabelText("Buscar artistas")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Próximo" })).toBeDisabled();
  });

  it("enables next only after three artists are selected and calls the route callback", async () => {
    const { onContinue } = renderScreen();
    const nextButton = screen.getByRole("button", { name: "Próximo" });

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "legiao");
    await waitFor(() => expect(screen.getByText("Legião Urbana")).toBeTruthy());
    fireEvent.press(screen.getByRole("checkbox", { name: "Legião Urbana" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Tribalistas" }));
    expect(nextButton).toBeDisabled();
    fireEvent.press(screen.getByRole("checkbox", { name: "Toquinho" }));
    expect(nextButton).toBeEnabled();

    fireEvent.press(nextButton);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("keeps selected artists checked as search results change", async () => {
    renderScreen();
    const input = screen.getByLabelText("Buscar artistas");
    fireEvent.changeText(input, "legiao");
    await waitFor(() => expect(screen.getByText("Legião Urbana")).toBeTruthy());

    fireEvent.press(screen.getByRole("checkbox", { name: "Legião Urbana" }));
    fireEvent.changeText(input, "toquinho");
    await waitFor(() => expect(mockUseArtistSearch).toHaveBeenLastCalledWith("toquinho"));

    expect(screen.getByRole("checkbox", { name: "Legião Urbana" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Toquinho" })).toBeTruthy();
  });

  it("keeps saved artists visible and selected when they are absent from the catalog", () => {
    renderScreen([{ id: 999, name: "Saved artist" }]);

    expect(screen.getByRole("checkbox", { name: "Saved artist" })).toBeChecked();
    expect(screen.getByText("Anitta")).toBeTruthy();
  });

  it("calls the route callback when the back button is pressed", () => {
    const { onBack } = renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when no artists are found", async () => {
    mockUseArtistSearch.mockImplementation(
      () =>
        ({
          data: [],
          isError: false,
          isFetching: false,
          isSuccess: true
        }) as unknown as ReturnType<typeof useArtistSearch>
    );
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "unknown");

    expect(await screen.findByText("Nenhum artista encontrado.")).toBeTruthy();
  });

  it("shows an error when artist search fails", async () => {
    mockUseArtistSearch.mockImplementation(
      () =>
        ({
          data: undefined,
          isError: true,
          isFetching: false,
          isSuccess: false
        }) as ReturnType<typeof useArtistSearch>
    );
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "error");

    expect(
      await screen.findByText("Não foi possível buscar artistas. Verifique sua conexão.")
    ).toBeTruthy();
  });
});
