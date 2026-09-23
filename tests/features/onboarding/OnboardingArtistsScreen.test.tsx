import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { clearSession } from "@/features/auth/session";
import { musicService } from "@/features/music/services/musicService";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { OnboardingProvider } from "@/features/onboarding/state/OnboardingContext";
import { i18n } from "@/i18n";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    canGoBack: mockCanGoBack,
    goBack: mockGoBack,
    navigate: mockNavigate,
    reset: mockReset
  })
}));

jest.mock("@/features/auth/session", () => ({
  clearSession: jest.fn(async () => undefined)
}));

jest.mock("@/features/music/services/musicService", () => ({
  musicService: {
    searchArtists: jest.fn(),
    getPopularArtists: jest.fn()
  }
}));

const mockSearchArtists = musicService.searchArtists as jest.Mock;
const mockGetPopularArtists = musicService.getPopularArtists as jest.Mock;

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <OnboardingProvider>
          <OnboardingArtistsScreen />
        </OnboardingProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("OnboardingArtistsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    mockSearchArtists.mockResolvedValue([
      { id: 1, name: "Legião Urbana", picture_url: null },
      { id: 2, name: "Tribalistas", picture_url: null },
      { id: 3, name: "Toquinho", picture_url: null }
    ]);
    mockGetPopularArtists.mockResolvedValue([
      { id: 101, name: "Anitta", picture_url: null },
      { id: 102, name: "Djavan", picture_url: null },
      { id: 103, name: "Marisa Monte", picture_url: null }
    ]);
  });

  it("shows popular artists by default before any search", async () => {
    renderScreen();

    expect(await screen.findByText("Anitta")).toBeTruthy();
    expect(screen.getByText("Djavan")).toBeTruthy();
    expect(screen.getByText("Marisa Monte")).toBeTruthy();
    expect(mockSearchArtists).not.toHaveBeenCalled();
  });

  it("shows an error state when popular artists fail to load", async () => {
    mockGetPopularArtists.mockRejectedValueOnce(new Error("Network error"));
    renderScreen();

    expect(await screen.findByText("Não foi possível carregar artistas populares.")).toBeTruthy();
  });

  it("renders the artist search step", () => {
    renderScreen();

    expect(screen.getByTestId("onboarding-artists-screen")).toBeTruthy();
    expect(screen.getByText("Artistas")).toBeTruthy();
    expect(screen.getByText("ETAPA 1 DE 3")).toBeTruthy();
    expect(screen.getByText("Quem faz parte da sua história?")).toBeTruthy();
    expect(
      screen.getByText("Escolha pelo menos 3 artistas para personalizar suas recordações.")
    ).toBeTruthy();
    expect(screen.getByLabelText("Buscar artistas")).toBeTruthy();
  });

  it("enables next only after three artists are selected and navigates to genres", async () => {
    renderScreen();

    const nextButton = screen.getByRole("button", { name: "Próximo" });
    expect(nextButton).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "legiao");

    await waitFor(() => expect(screen.getByText("Legião Urbana")).toBeTruthy());
    expect(mockSearchArtists).toHaveBeenCalledWith("legiao", expect.anything());

    fireEvent.press(screen.getByRole("checkbox", { name: "Legião Urbana" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Tribalistas" }));
    expect(nextButton).toBeDisabled();

    fireEvent.press(screen.getByRole("checkbox", { name: "Toquinho" }));
    expect(nextButton).toBeEnabled();

    fireEvent.press(nextButton);

    expect(mockNavigate).toHaveBeenCalledWith("OnboardingGenres");
  });

  it("keeps multiple selected artists checked", async () => {
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "toquinho");

    await waitFor(() => expect(screen.getByText("Toquinho")).toBeTruthy());

    fireEvent.press(screen.getByRole("checkbox", { name: "Legião Urbana" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Tribalistas" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Toquinho" }));

    expect(screen.getByRole("checkbox", { name: "Legião Urbana" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Tribalistas" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Toquinho" })).toBeChecked();
  });

  it("goes back when the header action is pressed", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("signs out and returns to login when the screen has no previous route", async () => {
    mockCanGoBack.mockReturnValueOnce(false);
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(clearSession).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    });
  });

  it("shows how many artists are selected", async () => {
    renderScreen();

    expect(screen.queryByTestId("onboarding-selection-count")).toBeNull();

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "legiao");
    await waitFor(() => expect(screen.getByText("Legião Urbana")).toBeTruthy());

    fireEvent.press(screen.getByRole("checkbox", { name: "Legião Urbana" }));
    expect(screen.getByText("1 selecionado")).toBeTruthy();

    fireEvent.press(screen.getByRole("checkbox", { name: "Tribalistas" }));
    expect(screen.getByText("2 selecionados")).toBeTruthy();
  });

  it("shows empty state when no artists are found", async () => {
    mockSearchArtists.mockResolvedValueOnce([]);
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "unknown");

    expect(await screen.findByText("Nenhum artista encontrado.")).toBeTruthy();
  });

  it("shows error state when search fails", async () => {
    mockSearchArtists.mockRejectedValueOnce(new Error("Network error"));
    renderScreen();

    fireEvent.changeText(screen.getByLabelText("Buscar artistas"), "error");

    expect(
      await screen.findByText("Não foi possível buscar artistas. Verifique sua conexão.")
    ).toBeTruthy();
  });

  it("keeps the search text and results when an artist is selected", async () => {
    renderScreen();

    const searchInput = screen.getByLabelText("Buscar artistas");
    fireEvent.changeText(searchInput, "legiao");

    await waitFor(() => expect(screen.getByText("Legião Urbana")).toBeTruthy());

    fireEvent.press(screen.getByRole("checkbox", { name: "Legião Urbana" }));

    expect(searchInput.props.value).toBe("legiao");
    expect(screen.getByRole("checkbox", { name: "Tribalistas" })).toBeTruthy();
    expect(mockSearchArtists).toHaveBeenCalledTimes(1);
  });

  it("clears search input when clear button is pressed", async () => {
    renderScreen();

    const searchInput = screen.getByLabelText("Buscar artistas");
    fireEvent.changeText(searchInput, "anitta");

    const clearButton = await screen.findByLabelText("Limpar busca");
    fireEvent.press(clearButton);

    expect(searchInput.props.value).toBe("");
  });
});
