import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";

import { useGenres } from "@/features/music/hooks/useGenres";
import { OnboardingGenresScreen } from "@/features/onboarding/screens/OnboardingGenresScreen";
import type { MusicSelection } from "@/features/onboarding";
import { i18n } from "@/i18n";

jest.mock("@/features/music/hooks/useGenres", () => ({
  useGenres: jest.fn()
}));

const genres = [
  { id: 1, name: "Pop", picture_url: "https://example.com/pop.jpg" },
  { id: 2, name: "Rock", picture_url: "https://example.com/rock.jpg" },
  { id: 3, name: "Jazz", picture_url: "https://example.com/jazz.jpg" },
  { id: 4, name: "Soul", picture_url: "https://example.com/soul.jpg" }
];

const mockedUseGenres = jest.mocked(useGenres);

function renderScreen(onContinue = jest.fn()) {
  function ControlledScreen() {
    const [selectedGenres, setSelectedGenres] = useState<MusicSelection[]>([]);

    return (
      <OnboardingGenresScreen
        onBack={jest.fn()}
        onContinue={onContinue}
        onSelectedGenresChange={setSelectedGenres}
        selectedGenres={selectedGenres}
      />
    );
  }

  return render(
    <I18nextProvider i18n={i18n}>
      <ControlledScreen />
    </I18nextProvider>
  );
}

describe("OnboardingGenresScreen", () => {
  beforeEach(() => {
    mockedUseGenres.mockReset();
    mockedUseGenres.mockReturnValue({
      data: genres,
      isError: false,
      isPending: false
    } as ReturnType<typeof useGenres>);
  });

  it("loads the genre grid without a search field", () => {
    renderScreen();

    expect(screen.getByText("ETAPA 2 DE 3")).toBeTruthy();
    expect(screen.getByText("Pop")).toBeTruthy();
    expect(screen.getByText("Rock")).toBeTruthy();
    expect(screen.queryByPlaceholderText(/pesquisar/i)).toBeNull();
  });

  it("enables continue only after three genres are selected", async () => {
    const onContinue = jest.fn();
    renderScreen(onContinue);

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

  it("keeps multiple selected genres checked", () => {
    renderScreen();

    fireEvent.press(screen.getByRole("checkbox", { name: "Pop" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Rock" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Jazz" }));

    expect(screen.getByRole("checkbox", { name: "Pop" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Rock" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Jazz" })).toBeChecked();
  });
});
