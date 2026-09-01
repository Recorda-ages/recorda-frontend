import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";

import { getGenres } from "@/features/onboarding/api/getGenres";
import { OnboardingGenresScreen } from "@/features/onboarding/screens/OnboardingGenresScreen";
import { i18n } from "@/i18n";

jest.mock("@/features/onboarding/api/getGenres", () => ({
  getGenres: jest.fn()
}));

const genres = [
  { id: 1, imagem: "https://example.com/pop.jpg", nome: "Pop" },
  { id: 2, imagem: "https://example.com/rock.jpg", nome: "Rock" },
  { id: 3, imagem: "https://example.com/jazz.jpg", nome: "Jazz" },
  { id: 4, imagem: "https://example.com/soul.jpg", nome: "Soul" }
];

const mockedGetGenres = jest.mocked(getGenres);

function renderScreen(onContinue = jest.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });

  function ControlledScreen() {
    const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);

    return (
      <OnboardingGenresScreen
        onBack={jest.fn()}
        onContinue={onContinue}
        onSelectedGenreIdsChange={setSelectedGenreIds}
        selectedGenreIds={selectedGenreIds}
      />
    );
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ControlledScreen />
      </I18nextProvider>
    </QueryClientProvider>
  );
}

describe("OnboardingGenresScreen", () => {
  beforeEach(() => {
    mockedGetGenres.mockReset();
    mockedGetGenres.mockResolvedValue(genres);
  });

  it("loads the genre grid without a search field", async () => {
    renderScreen();

    expect(screen.getByText("ETAPA 2 DE 3")).toBeTruthy();
    expect(await screen.findByText("Pop")).toBeTruthy();
    expect(screen.getByText("Rock")).toBeTruthy();
    expect(screen.queryByPlaceholderText(/pesquisar/i)).toBeNull();
  });

  it("enables continue only after three genres are selected", async () => {
    const onContinue = jest.fn();
    renderScreen(onContinue);

    await screen.findByText("Pop");
    const continueButton = screen.getByRole("button", { name: "Próximo" });

    expect(continueButton).toBeDisabled();
    fireEvent.press(screen.getByRole("checkbox", { name: "Pop" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Rock" }));
    expect(continueButton).toBeDisabled();

    fireEvent.press(screen.getByRole("checkbox", { name: "Jazz" }));
    expect(continueButton).toBeEnabled();
    fireEvent.press(continueButton);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
