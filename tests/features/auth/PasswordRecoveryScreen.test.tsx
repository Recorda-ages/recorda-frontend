import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";
import * as passwordRecoveryApi from "@/features/auth/api/passwordRecovery";
import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";

let testQueryClient: QueryClient | null = null;

function renderPasswordRecoveryScreen() {
  testQueryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false }
    }
  });

  const navigation = {
    goBack: jest.fn(),
    reset: jest.fn()
  };

  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={testQueryClient}>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <PasswordRecoveryScreen
              navigation={navigation as never}
              route={{ key: "PasswordRecovery", name: "PasswordRecovery" } as never}
            />
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );

  return navigation;
}

describe("PasswordRecoveryScreen", () => {
  beforeEach(() => {
    jest
      .spyOn(passwordRecoveryApi, "requestPasswordRecovery")
      .mockResolvedValue({ message: "Senha redefinida com sucesso" });
  });

  afterEach(() => {
    testQueryClient?.clear();
    testQueryClient = null;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders the password recovery screen from the visual reference", () => {
    renderPasswordRecoveryScreen();

    expect(screen.getByTestId("password-recovery-screen")).toBeTruthy();
    expect(screen.getByText("Recuperar Senha")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByText("Volte a recordar")).toBeTruthy();
    expect(screen.getByText("Informe seu email para definir uma nova senha.")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Nova Senha").props.secureTextEntry).toBe(true);
    expect(screen.getByLabelText("Confirmar Senha").props.secureTextEntry).toBe(true);
    expect(screen.getByRole("button", { name: "Redefinir Senha" })).toBeTruthy();
  });

  it("requires a valid email and matching passwords before allowing submission", async () => {
    renderPasswordRecoveryScreen();

    const submitButton = screen.getByRole("button", { name: "Redefinir Senha" });

    expect(submitButton).toBeDisabled();

    screen.getByLabelText("Email").props.onBlur();

    expect(await screen.findByText("Informe seu email.")).toBeTruthy();
    expect(submitButton).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Email"), "email-invalido");

    expect(await screen.findByText("Informe um email válido.")).toBeTruthy();
    expect(submitButton).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Email"), "ana@example.com");

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    fireEvent.changeText(screen.getByLabelText("Nova Senha"), "1234567");

    expect(await screen.findByText("A senha deve ter pelo menos 8 caracteres.")).toBeTruthy();
    expect(submitButton).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Nova Senha"), "senha-segura");
    fireEvent.changeText(screen.getByLabelText("Confirmar Senha"), "senha-diferente");

    expect(await screen.findByText("As senhas devem ser idênticas.")).toBeTruthy();
    expect(submitButton).toBeDisabled();

    fireEvent.press(submitButton);
    expect(passwordRecoveryApi.requestPasswordRecovery).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText("Confirmar Senha"), "senha-segura");

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    expect(passwordRecoveryApi.requestPasswordRecovery).not.toHaveBeenCalled();
  });

  it("goes back from the app bar action", () => {
    const navigation = renderPasswordRecoveryScreen();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("shows success feedback after submitting a valid form", async () => {
    const navigation = renderPasswordRecoveryScreen();

    fireEvent.changeText(screen.getByLabelText("Email"), "ana@example.com");
    fireEvent.changeText(screen.getByLabelText("Nova Senha"), "senha-segura");
    fireEvent.changeText(screen.getByLabelText("Confirmar Senha"), "senha-segura");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Redefinir Senha" })).not.toBeDisabled();
    });

    fireEvent.press(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(passwordRecoveryApi.requestPasswordRecovery).toHaveBeenCalledTimes(1);
    });
    expect((passwordRecoveryApi.requestPasswordRecovery as jest.Mock).mock.calls[0][0]).toEqual({
      email: "ana@example.com",
      newPassword: "senha-segura"
    });
    expect(await screen.findByText("Sua senha foi redefinida com sucesso.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redefinir Senha" })).toBeDisabled();

    await waitFor(
      () => {
        expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
      },
      { timeout: 2500 }
    );
  });

  it.each([
    ["email inexistente", new Error("Email não encontrado.")],
    ["erro de rede", new TypeError("Network request failed.")],
    ["erro inesperado", new Error("Internal server error.")]
  ])("shows the same generic error for %s", async (_, requestError) => {
    jest.spyOn(passwordRecoveryApi, "requestPasswordRecovery").mockRejectedValueOnce(requestError);

    renderPasswordRecoveryScreen();

    fireEvent.changeText(screen.getByLabelText("Email"), "erro@example.com");
    fireEvent.changeText(screen.getByLabelText("Nova Senha"), "senha-segura");
    fireEvent.changeText(screen.getByLabelText("Confirmar Senha"), "senha-segura");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Redefinir Senha" })).not.toBeDisabled();
    });

    fireEvent.press(screen.getByRole("button", { name: "Redefinir Senha" }));

    expect(
      await screen.findByText("Não foi possível redefinir sua senha. Tente novamente.")
    ).toBeTruthy();
    expect(screen.queryByText(requestError.message)).toBeNull();
    expect(screen.queryByTestId("login-screen")).toBeNull();
  });

  it("blocks duplicate submissions while pending and allows retry after an error", async () => {
    let rejectFirstRequest: ((reason?: unknown) => void) | undefined;
    const firstRequest = new Promise<passwordRecoveryApi.PasswordRecoveryResponse>((_, reject) => {
      rejectFirstRequest = reject;
    });
    const requestSpy = jest
      .spyOn(passwordRecoveryApi, "requestPasswordRecovery")
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce({ message: "Senha redefinida com sucesso" });

    renderPasswordRecoveryScreen();

    fireEvent.changeText(screen.getByLabelText("Email"), "ana@example.com");
    fireEvent.changeText(screen.getByLabelText("Nova Senha"), "senha-segura");
    fireEvent.changeText(screen.getByLabelText("Confirmar Senha"), "senha-segura");

    const submitButton = screen.getByRole("button", { name: "Redefinir Senha" });
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(requestSpy).toHaveBeenCalledTimes(1);
      expect(submitButton).toBeDisabled();
      expect(submitButton.props.accessibilityState).toEqual({ busy: true, disabled: true });
    });

    fireEvent.press(submitButton);
    expect(requestSpy).toHaveBeenCalledTimes(1);

    rejectFirstRequest?.(new Error("Email não encontrado."));

    expect(
      await screen.findByText("Não foi possível redefinir sua senha. Tente novamente.")
    ).toBeTruthy();
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    fireEvent.press(submitButton);

    await waitFor(() => expect(requestSpy).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Sua senha foi redefinida com sucesso.")).toBeTruthy();
    expect(screen.queryByText("Não foi possível redefinir sua senha. Tente novamente.")).toBeNull();
  });
});
