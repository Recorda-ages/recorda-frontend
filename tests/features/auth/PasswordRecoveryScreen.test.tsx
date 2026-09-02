import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "@/app/navigation/RootNavigator";
import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";

let testQueryClient: QueryClient | null = null;

function renderPasswordRecoveryScreen() {
  testQueryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false }
    }
  });

  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={testQueryClient}>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <RootNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
  fireEvent.press(screen.getByRole("button", { name: "Esqueci minha senha" }));
}

describe("PasswordRecoveryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    testQueryClient?.clear();
    testQueryClient = null;
    jest.useRealTimers();
  });

  it("renders the password recovery screen from the visual reference", () => {
    renderPasswordRecoveryScreen();

    expect(screen.getByTestId("password-recovery-screen")).toBeTruthy();
    expect(screen.getByText("Recuperar Senha")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByText("Volte a recordar")).toBeTruthy();
    expect(screen.getByText("Informe seu email para definir uma nova senha.")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redefinir Senha" })).toBeTruthy();
  });

  it("requires a valid email before allowing submission", async () => {
    renderPasswordRecoveryScreen();

    const submitButton = screen.getByRole("button", { name: "Redefinir Senha" });

    expect(submitButton).toBeDisabled();

    screen.getByLabelText("Email").props.onBlur();

    expect(await screen.findByText("Informe seu email.")).toBeTruthy();
    expect(submitButton).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Email"), "email-invalido");

    expect(await screen.findByText("Informe um email valido.")).toBeTruthy();
    expect(submitButton).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Email"), "ana@example.com");

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("goes back from the app bar action", () => {
    renderPasswordRecoveryScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.getByTestId("login-screen")).toBeTruthy();
  });

  it("shows success feedback and returns to login after submitting a valid email", async () => {
    renderPasswordRecoveryScreen();

    fireEvent.changeText(screen.getByLabelText("Email"), "ana@example.com");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Redefinir Senha" })).not.toBeDisabled();
    });

    jest.useFakeTimers();
    fireEvent.press(screen.getByRole("button", { name: "Redefinir Senha" }));

    expect(await screen.findByText("Enviamos as instrucoes para o seu email.")).toBeTruthy();
    expect(screen.queryByTestId("login-screen")).toBeNull();

    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(screen.getByTestId("login-screen")).toBeTruthy();
    });
  });

  it("shows a generic error when the mocked recovery request fails", async () => {
    renderPasswordRecoveryScreen();

    fireEvent.changeText(screen.getByLabelText("Email"), "erro@example.com");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Redefinir Senha" })).not.toBeDisabled();
    });

    fireEvent.press(screen.getByRole("button", { name: "Redefinir Senha" }));

    expect(
      await screen.findByText("Nao foi possivel redefinir sua senha. Tente novamente.")
    ).toBeTruthy();
    expect(screen.queryByText("Mock password recovery failed.")).toBeNull();
    expect(screen.queryByTestId("login-screen")).toBeNull();
  });
});
