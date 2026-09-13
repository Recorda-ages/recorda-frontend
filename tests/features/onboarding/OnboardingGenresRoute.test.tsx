import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";

import { useGenres } from "@/features/music/hooks/useGenres";
import { OnboardingGenresRoute } from "@/features/onboarding";
import { OnboardingProvider } from "@/features/onboarding/state/OnboardingContext";
import { i18n } from "@/i18n";

const mockCanGoBack = jest.fn();
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    canGoBack: mockCanGoBack,
    goBack: mockGoBack,
    navigate: mockNavigate
  })
}));

jest.mock("@/features/music/hooks/useGenres", () => ({
  useGenres: jest.fn()
}));

const mockedUseGenres = jest.mocked(useGenres);

function setup() {
  mockedUseGenres.mockReturnValue({
    data: [
      { id: 1, name: "Pop", picture_url: null },
      { id: 2, name: "Rock", picture_url: null },
      { id: 3, name: "Jazz", picture_url: null }
    ],
    isError: false,
    isPending: false
  } as ReturnType<typeof useGenres>);

  render(
    <I18nextProvider i18n={i18n}>
      <OnboardingProvider>
        <OnboardingGenresRoute />
      </OnboardingProvider>
    </I18nextProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack.mockReturnValue(true);
});

it("navigates to favorite music with selected genres", () => {
  setup();

  fireEvent.press(screen.getByRole("checkbox", { name: "Pop" }));
  fireEvent.press(screen.getByRole("checkbox", { name: "Rock" }));
  fireEvent.press(screen.getByRole("checkbox", { name: "Jazz" }));
  fireEvent.press(screen.getByRole("button", { name: "Próximo" }));

  expect(mockNavigate).toHaveBeenCalledWith("OnboardingMusic");
  expect(screen.getByText("3 selecionados")).toBeTruthy();
});

it("goes back to the previous onboarding step when one exists", () => {
  setup();

  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

  expect(mockGoBack).toHaveBeenCalledTimes(1);
});
