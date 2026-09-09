import { fireEvent, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";

import { i18n } from "@/i18n";
import { OnboardingMusicPreview } from "@/features/onboarding/screens/OnboardingMusicPreview";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack })
}));

beforeEach(() => mockGoBack.mockClear());

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } }
  });
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <OnboardingMusicPreview />
      </QueryClientProvider>
    </I18nextProvider>
  );
}

it("searches the local tracks ignoring accents and finishes without sending data", async () => {
  setup();
  fireEvent.changeText(screen.getByLabelText("Buscar músicas"), "evidencias");
  fireEvent.press(await screen.findByRole("radio", { name: "Evidências, Chitãozinho & Xororó" }));
  fireEvent.press(screen.getByRole("button", { name: "Começar a Recordar" }));

  expect(await screen.findByText("Demonstração concluída. Nenhum dado foi enviado.")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});
