import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { musicService } from "@/features/music/services/musicService";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { OnboardingProvider } from "@/features/onboarding/state/OnboardingContext";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    canGoBack: mockCanGoBack,
    goBack: mockGoBack,
    navigate: mockNavigate
  })
}));

jest.mock("@/features/music/services/musicService", () => ({
  musicService: {
    searchArtists: jest.fn()
  }
}));

const mockSearchArtists = musicService.searchArtists as jest.Mock;

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });

  return render(
    <QueryClientProvider client={client}>
      <OnboardingProvider>
        <OnboardingArtistsScreen />
      </OnboardingProvider>
    </QueryClientProvider>
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
    expect(mockSearchArtists).toHaveBeenCalledWith("legiao");

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

  it("does not go back when the screen has no previous route", () => {
    mockCanGoBack.mockReturnValueOnce(false);
    renderScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockGoBack).not.toHaveBeenCalled();
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
});
