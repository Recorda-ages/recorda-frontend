import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Text } from "react-native";
import { I18nextProvider } from "react-i18next";

import { queryClient as appQueryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { OnboardingMusicRoute } from "@/features/onboarding";
import { OnboardingProvider, useOnboarding } from "@/features/onboarding/state/OnboardingContext";
import { i18n } from "@/i18n";

const mockGoBack = jest.fn();
const mockReset = jest.fn();
const artists = [{ id: 10, name: "Legião Urbana" }];
const genres = [{ id: 152, name: "Rock" }];

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, reset: mockReset })
}));

jest.mock("@/features/onboarding/api/music", () => ({
  searchTracks: jest.fn(async () => [{ id: 1, title: "Tempo Perdido", artist: "Legião Urbana" }]),
  saveMusicPreferences: jest.fn(async () => undefined)
}));

const { saveMusicPreferences } = jest.requireMock("@/features/onboarding/api/music");

function SelectionSeeder() {
  const { setSelectedArtists, setSelectedGenres } = useOnboarding();

  useEffect(() => {
    setSelectedArtists(artists);
    setSelectedGenres(genres);
  }, [setSelectedArtists, setSelectedGenres]);

  return null;
}

function SelectionProbe() {
  const { selectedArtists, selectedGenres } = useOnboarding();

  return <Text testID="selection-size">{selectedArtists.length + selectedGenres.length}</Text>;
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } }
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <OnboardingProvider>
          <SelectionSeeder />
          <SelectionProbe />
          <OnboardingMusicRoute />
        </OnboardingProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

beforeEach(() => {
  mockGoBack.mockClear();
  mockReset.mockClear();
  saveMusicPreferences.mockClear();
  appQueryClient.clear();
});

it("submits the selections kept in the onboarding state and lands on the feed", async () => {
  appQueryClient.setQueryData(AUTH_ME_QUERY_KEY, {
    account_type: "common",
    id: 1,
    name: "Gabriel",
    onboarding_completed: false,
    username: "gabriel"
  });
  setup();
  await waitFor(() => expect(screen.getByTestId("selection-size")).toHaveTextContent("2"));

  fireEvent.changeText(screen.getByLabelText("Buscar músicas"), "Tempo");
  fireEvent.press(await screen.findByRole("radio", { name: "Tempo Perdido, Legião Urbana" }));
  fireEvent.press(screen.getByRole("button", { name: "Começar a Recordar" }));

  await waitFor(() => expect(saveMusicPreferences).toHaveBeenCalledTimes(1));
  expect(saveMusicPreferences.mock.calls[0][0]).toEqual({
    artists,
    genres,
    track: { id: 1, title: "Tempo Perdido", artist: "Legião Urbana" }
  });
  await waitFor(() =>
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Feed" }] })
  );
  expect(appQueryClient.getQueryData(AUTH_ME_QUERY_KEY)).toEqual(
    expect.objectContaining({ onboarding_completed: true })
  );
  expect(screen.getByTestId("selection-size")).toHaveTextContent("0");
});

it("goes back to the previous step without submitting", () => {
  setup();
  fireEvent.press(screen.getByRole("button", { name: "Voltar para gêneros" }));
  expect(mockGoBack).toHaveBeenCalledTimes(1);
  expect(saveMusicPreferences).not.toHaveBeenCalled();
});
