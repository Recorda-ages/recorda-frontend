import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { OnboardingProvider } from "@/features/onboarding/providers/OnboardingContext";
import { musicService } from "@/features/music/services/musicService";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      canGoBack: mockCanGoBack
    })
  };
});

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
    mockSearchArtists.mockResolvedValue([
      { id: 1, name: "Legião Urbana", picture_url: null },
      { id: 2, name: "Tribalistas", picture_url: null },
      { id: 3, name: "Toquinho", picture_url: null }
    ]);
  });

  it("renders screen header, stepper and search input", () => {
    renderScreen();

    expect(screen.getByText("Artistas")).toBeTruthy();
    expect(screen.getByText("ETAPA 1 DE 3")).toBeTruthy();
    expect(screen.getByText("Quem faz parte da sua história?")).toBeTruthy();
    expect(
      screen.getByText("Escolha pelo menos 3 artistas para personalizar suas recordações.")
    ).toBeTruthy();
    expect(screen.getByPlaceholderText("Buscar artistas")).toBeTruthy();
  });

  it("disables next button initially when fewer than 3 artists are selected", () => {
    renderScreen();

    const nextButton = screen.getByTestId("onboarding-artists-next-button");
    expect(nextButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("searches artists, allows selecting 3 artists, and enables next button to navigate to OnboardingGenres", async () => {
    renderScreen();

    const searchInput = screen.getByPlaceholderText("Buscar artistas");
    fireEvent.changeText(searchInput, "Legião");

    await waitFor(() => {
      expect(screen.getByText("Legião Urbana")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Legião Urbana"));
    fireEvent.press(screen.getByText("Tribalistas"));
    fireEvent.press(screen.getByText("Toquinho"));

    expect(screen.getByText("3 artistas selecionados")).toBeTruthy();

    const nextButton = screen.getByTestId("onboarding-artists-next-button");
    expect(nextButton.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(nextButton);

    expect(mockNavigate).toHaveBeenCalledWith("OnboardingGenres", {
      artists: [
        { id: 1, name: "Legião Urbana" },
        { id: 2, name: "Tribalistas" },
        { id: 3, name: "Toquinho" }
      ]
    });
  });

  it("navigates back when back button is pressed", () => {
    renderScreen();

    const backButton = screen.getByTestId("onboarding-artists-back-button");
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
