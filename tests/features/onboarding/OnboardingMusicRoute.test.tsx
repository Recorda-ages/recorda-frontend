import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";

import { i18n } from "@/i18n";
import { OnboardingMusicRoute } from "@/features/onboarding";

const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockParams = {
  artists: [{ id: 10, name: "Legião Urbana" }],
  genres: [{ id: 152, name: "Rock" }]
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack, reset: mockReset }),
  useRoute: () => ({ params: mockParams })
}));

jest.mock("@/features/onboarding/api/music", () => ({
  searchTracks: jest.fn(async () => [{ id: 1, title: "Tempo Perdido", artist: "Legião Urbana" }]),
  saveMusicPreferences: jest.fn(async () => undefined)
}));

const { saveMusicPreferences } = jest.requireMock("@/features/onboarding/api/music");

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } }
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <OnboardingMusicRoute />
      </QueryClientProvider>
    </I18nextProvider>
  );
}

beforeEach(() => {
  mockGoBack.mockClear();
  mockReset.mockClear();
  saveMusicPreferences.mockClear();
});

it("submits the three steps and lands on the feed", async () => {
  setup();
  fireEvent.changeText(screen.getByLabelText("Buscar músicas"), "Tempo");
  fireEvent.press(await screen.findByRole("radio", { name: "Tempo Perdido, Legião Urbana" }));
  fireEvent.press(screen.getByRole("button", { name: "Começar a Recordar" }));

  await waitFor(() => expect(saveMusicPreferences).toHaveBeenCalledTimes(1));
  expect(saveMusicPreferences.mock.calls[0][0]).toEqual({
    artists: mockParams.artists,
    genres: mockParams.genres,
    track: { id: 1, title: "Tempo Perdido", artist: "Legião Urbana" }
  });
  expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Home" }] });
});

it("goes back to the previous step without submitting", () => {
  setup();
  fireEvent.press(screen.getByRole("button", { name: "Voltar para gêneros" }));
  expect(mockGoBack).toHaveBeenCalledTimes(1);
  expect(saveMusicPreferences).not.toHaveBeenCalled();
});
