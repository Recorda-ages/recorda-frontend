import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { clearSession } from "@/features/auth/session";
import { OnboardingArtistsRoute } from "@/features/onboarding/screens/OnboardingArtistsRoute";
import { OnboardingProvider } from "@/features/onboarding/state/OnboardingContext";
import { i18n } from "@/i18n";

let mockNavigation: {
  canGoBack: jest.Mock;
  goBack: jest.Mock;
  navigate: jest.Mock;
  reset: jest.Mock;
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation
}));
jest.mock("@/features/auth/session", () => ({
  ...jest.requireActual("@/features/auth/session"),
  clearSession: jest.fn(async () => undefined)
}));
jest.mock("@/features/music/hooks/useArtistSearch", () => ({
  useArtistSearch: jest.fn(() => ({
    data: [],
    isError: false,
    isFetching: false,
    isSuccess: true
  }))
}));
jest.mock("@/features/music/hooks/usePopularArtists", () => ({
  usePopularArtists: jest.fn(() => ({
    data: [
      { id: 10, name: "Artist One", picture_url: null },
      { id: 20, name: "Artist Two", picture_url: null },
      { id: 30, name: "Artist Three", picture_url: null }
    ],
    isError: false,
    isPending: false
  }))
}));

function renderRoute() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } }
  });

  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <OnboardingProvider>
          <OnboardingArtistsRoute />
        </OnboardingProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigation = {
    canGoBack: jest.fn(() => true),
    goBack: jest.fn(),
    navigate: jest.fn(),
    reset: jest.fn()
  };
});

it("keeps back navigation in the onboarding route", () => {
  renderRoute();

  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  expect(clearSession).not.toHaveBeenCalled();
});

it("clears the incomplete session and returns to login when onboarding has no previous route", async () => {
  mockNavigation.canGoBack.mockReturnValue(false);
  renderRoute();

  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

  await waitFor(() => {
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "Login" }]
    });
  });
});

it("continues into the genre step from the route callback", () => {
  renderRoute();

  fireEvent.press(screen.getByRole("checkbox", { name: "Artist One" }));
  fireEvent.press(screen.getByRole("checkbox", { name: "Artist Two" }));
  fireEvent.press(screen.getByRole("checkbox", { name: "Artist Three" }));
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));

  expect(mockNavigation.navigate).toHaveBeenCalledWith("OnboardingGenres");
});
