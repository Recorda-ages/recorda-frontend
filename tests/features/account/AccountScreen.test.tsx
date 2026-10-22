import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";

import { ToastProvider } from "@/components/ui/ToastProvider";
import { AccountScreen } from "@/features/account";
import { accountAdapter } from "@/features/account/services/accountAdapter";
import { resetAccountMock, seedAccountMock } from "@/features/account/services/accountService.mock";
import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { clearSession } from "@/features/auth/session";
import { OnboardingProvider } from "@/features/onboarding/state/OnboardingContext";
import { RecordaDraftProvider } from "@/features/recorda-creation/context/RecordaDraftContext";
import { i18n } from "@/i18n";
import { ApiError, authApiClient } from "@/services/api";
import { paperTheme } from "@/theme";

const mockNavigation = { goBack: jest.fn(), navigate: jest.fn(), reset: jest.fn() };

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => mockNavigation
}));

jest.mock("@/features/auth/session", () => ({
  ...jest.requireActual("@/features/auth/session"),
  clearSession: jest.fn(async () => undefined)
}));

const currentUser: CurrentUser = {
  name: "John Doe",
  onboarding_completed: true,
  role: "USER",
  user_id: "user-1",
  username: "john_doe"
};

const mockClearSession = clearSession as jest.Mock;

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity }, queries: { gcTime: Infinity } }
  });
  client.setQueryData(AUTH_ME_QUERY_KEY, currentUser);

  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={paperTheme}>
          <ToastProvider>
            <OnboardingProvider>
              <RecordaDraftProvider>
                <AccountScreen />
              </RecordaDraftProvider>
            </OnboardingProvider>
          </ToastProvider>
        </PaperProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );

  return client;
}

async function renderLoaded() {
  const client = renderScreen();
  await screen.findByDisplayValue("John Doe");
  return client;
}

function saveButton() {
  return screen.getByTestId("account-save-button");
}

describe("AccountScreen", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetAccountMock();
    seedAccountMock("user-1", {
      email: "john@gmail.com",
      name: "John Doe",
      username: "john_doe"
    });
    jest.spyOn(authApiClient, "get").mockResolvedValue(currentUser);
    jest.spyOn(authApiClient, "delete").mockResolvedValue(null);
  });

  it("shows the current account data with saving disabled until something changes", async () => {
    await renderLoaded();

    expect(screen.getByText("Conta")).toBeTruthy();
    expect(screen.getByText("Informações")).toBeTruthy();
    expect(screen.getByText("Alterar Senha")).toBeTruthy();
    expect(screen.getByDisplayValue("@john_doe")).toBeTruthy();
    expect(screen.getByDisplayValue("john@gmail.com")).toBeTruthy();
    expect(screen.getByLabelText("Nova senha").props.value).toBe("");
    expect(screen.getByLabelText("Repetir nova senha").props.value).toBe("");
    expect(saveButton()).toBeDisabled();

    fireEvent.changeText(screen.getByLabelText("Nome"), "John Silva");
    expect(saveButton()).toBeEnabled();
  });

  it("goes back with the header arrow", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it("saves only the changed fields and refreshes the signed-in user", async () => {
    const update = jest.spyOn(accountAdapter, "updateAccount");
    const client = await renderLoaded();

    fireEvent.changeText(screen.getByLabelText("Nome"), "  John Silva ");
    fireEvent.changeText(screen.getByLabelText("Usuário"), "@john_silva");
    fireEvent.press(saveButton());

    expect(await screen.findByText("Dados atualizados.")).toBeTruthy();
    expect(update).toHaveBeenCalledWith({ name: "John Silva", username: "john_silva" });
    expect(client.getQueryData<CurrentUser>(AUTH_ME_QUERY_KEY)).toMatchObject({
      name: "John Silva",
      username: "john_silva"
    });
    expect(screen.getByDisplayValue("@john_silva")).toBeTruthy();
    expect(saveButton()).toBeDisabled();
  });

  it("keeps what was typed and does not save when the format is invalid", async () => {
    const update = jest.spyOn(accountAdapter, "updateAccount");
    await renderLoaded();

    fireEvent.changeText(screen.getByLabelText("Email"), "john-at-gmail");
    fireEvent.changeText(screen.getByLabelText("Nome"), "   ");
    fireEvent.press(saveButton());

    expect(await screen.findByText("Informe um email válido.")).toBeTruthy();
    expect(screen.getByText("Informe seu nome.")).toBeTruthy();
    expect(screen.getByDisplayValue("john-at-gmail")).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it("shows when the username or the email is already in use", async () => {
    await renderLoaded();

    fireEvent.changeText(screen.getByLabelText("Usuário"), "admin");
    fireEvent.changeText(screen.getByLabelText("Email"), "admin@recorda.app");
    fireEvent.press(saveButton());

    expect(await screen.findByText("Esse usuário já está em uso.")).toBeTruthy();
    expect(screen.getByText("Esse email já está em uso.")).toBeTruthy();
    expect(screen.getByDisplayValue("@admin")).toBeTruthy();
    expect(screen.getByDisplayValue("admin@recorda.app")).toBeTruthy();
  });

  it("only sends the password when both fields are filled and match", async () => {
    const update = jest.spyOn(accountAdapter, "updateAccount");
    await renderLoaded();

    fireEvent.changeText(screen.getByLabelText("Nova senha"), "novasenha1");
    fireEvent.press(saveButton());
    expect(await screen.findByText("Preencha os dois campos para alterar a senha.")).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("Repetir nova senha"), "outrasenha1");
    fireEvent.press(saveButton());
    expect(await screen.findByText("As senhas devem ser idênticas.")).toBeTruthy();
    expect(update).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText("Repetir nova senha"), "novasenha1");
    fireEvent.press(saveButton());

    expect(await screen.findByText("Dados atualizados.")).toBeTruthy();
    expect(update).toHaveBeenCalledWith({ password: "novasenha1" });
    expect(screen.getByLabelText("Nova senha").props.value).toBe("");
    expect(screen.getByLabelText("Repetir nova senha").props.value).toBe("");
  });

  it("asks for a longer new password", async () => {
    await renderLoaded();

    fireEvent.changeText(screen.getByLabelText("Nova senha"), "curta");
    fireEvent.changeText(screen.getByLabelText("Repetir nova senha"), "curta");
    fireEvent.press(saveButton());

    expect(await screen.findByText("A senha deve ter no mínimo 8 caracteres.")).toBeTruthy();
  });

  it("shows a save error without losing the form", async () => {
    jest.spyOn(accountAdapter, "updateAccount").mockRejectedValueOnce(new Error("offline"));
    await renderLoaded();

    fireEvent.changeText(screen.getByLabelText("Nome"), "John Silva");
    fireEvent.press(saveButton());

    expect(await screen.findByText("Não foi possível salvar. Tente novamente.")).toBeTruthy();
    expect(screen.getByDisplayValue("John Silva")).toBeTruthy();
  });

  it("offers a retry when the account cannot be loaded", async () => {
    jest
      .spyOn(authApiClient, "get")
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(currentUser);
    renderScreen();

    expect(
      await screen.findByText("Não foi possível carregar sua conta.", {}, { timeout: 4000 })
    ).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByDisplayValue("John Doe")).toBeTruthy();
  });

  it("returns to Login when the session is no longer valid", async () => {
    jest
      .spyOn(authApiClient, "get")
      .mockRejectedValue(new ApiError("UNAUTHORIZED", "expired", 401, null));
    renderScreen();

    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    expect(await screen.findByText("Sua sessão expirou. Entre novamente.")).toBeTruthy();
  });

  it("closes the delete dialog without deleting when cancelled", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByRole("button", { name: "Excluir Conta" }));
    expect(screen.getByText("Excluir conta")).toBeTruthy();
    expect(
      screen.getByText(
        "Tem certeza que deseja excluir sua conta? Essa ação não pode ser revertida."
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByTestId("delete-account-dialog")).toBeNull());
    expect(authApiClient.delete).not.toHaveBeenCalled();
    expect(mockClearSession).not.toHaveBeenCalled();
  });

  it("deletes the account, clears the session and goes to Login", async () => {
    await renderLoaded();

    fireEvent.press(screen.getByRole("button", { name: "Excluir Conta" }));
    fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(mockClearSession).toHaveBeenCalledTimes(1));
    expect(authApiClient.delete).toHaveBeenCalledWith("/users/me");
    expect(mockNavigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    expect(await screen.findByText("Sua conta foi excluída.")).toBeTruthy();
  });

  it("keeps the dialog open with an error when the deletion fails", async () => {
    jest.spyOn(authApiClient, "delete").mockRejectedValueOnce(new Error("offline"));
    await renderLoaded();

    fireEvent.press(screen.getByRole("button", { name: "Excluir Conta" }));
    fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText("Não foi possível excluir a conta. Tente novamente.")
    ).toBeTruthy();
    expect(screen.getByTestId("delete-account-dialog")).toBeTruthy();
    expect(mockClearSession).not.toHaveBeenCalled();
    expect(mockNavigation.reset).not.toHaveBeenCalled();
  });

  it("shows the screen in English", async () => {
    await i18n.changeLanguage("en");

    try {
      await renderLoaded();

      expect(screen.getByText("Account")).toBeTruthy();
      expect(screen.getByText("Information")).toBeTruthy();
      expect(screen.getByText("Change Password")).toBeTruthy();
      expect(screen.getByPlaceholderText("New password")).toBeTruthy();
      expect(screen.getByPlaceholderText("Repeat new password")).toBeTruthy();
      expect(screen.getByText("Delete Account")).toBeTruthy();
      expect(screen.getByText("Save")).toBeTruthy();
    } finally {
      await i18n.changeLanguage("pt-BR");
    }
  });
});
