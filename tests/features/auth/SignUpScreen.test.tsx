import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import * as registerApi from "@/features/auth/api/register";
import { secureStorage } from "@/services/storage";
import { ApiError } from "@/services/api/errors";

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  reset: jest.fn()
};

jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => mockNavigation
  };
});

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

let testQueryClient: QueryClient | null = null;

function renderSignUpScreen() {
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
            <SignUpScreen />
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );

  return mockNavigation;
}

describe("SignUpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    testQueryClient?.clear();
    testQueryClient = null;
  });

  it("renders the 4 defined fields, logo, titles, submit button and login link", () => {
    renderSignUpScreen();

    expect(screen.getByTestId("sign-up-screen")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByText("Guarde o momento")).toBeTruthy();
    expect(screen.getByText("Crie sua conta e transforme momentos em trilhas.")).toBeTruthy();

    expect(screen.getByTestId("input-name")).toBeTruthy();
    expect(screen.getByTestId("input-username")).toBeTruthy();
    expect(screen.getByTestId("input-email")).toBeTruthy();
    expect(screen.getByTestId("input-password")).toBeTruthy();

    expect(screen.getByTestId("submit-button")).toBeTruthy();
    expect(screen.getByTestId("login-link")).toBeTruthy();
    expect(screen.getByText("Já tem uma conta?")).toBeTruthy();
  });

  it("blocks submission and shows inline errors when fields are empty", async () => {
    const registerSpy = jest.spyOn(registerApi, "registerUser");
    renderSignUpScreen();

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Informe seu nome.")).toBeTruthy();
    expect(await screen.findByText("Informe seu usuário.")).toBeTruthy();
    expect(await screen.findByText("Informe seu email.")).toBeTruthy();
    expect(await screen.findByText("A senha deve ter no mínimo 8 caracteres.")).toBeTruthy();

    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("validates that username cannot contain spaces", async () => {
    const registerSpy = jest.spyOn(registerApi, "registerUser");
    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "user name com espaco");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha1234");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("O usuário não pode conter espaços.")).toBeTruthy();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("validates that username cannot contain leading or trailing spaces", async () => {
    const registerSpy = jest.spyOn(registerApi, "registerUser");
    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), " eduardo ");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha1234");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("O usuário não pode conter espaços.")).toBeTruthy();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    const registerSpy = jest.spyOn(registerApi, "registerUser");
    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "email-invalido");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha1234");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Informe um email válido.")).toBeTruthy();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("blocks short password from reaching the backend", async () => {
    const registerSpy = jest.spyOn(registerApi, "registerUser");
    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "1234567"); // 7 chars

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("A senha deve ter no mínimo 8 caracteres.")).toBeTruthy();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("toggles password visibility when tapping the eye button", () => {
    renderSignUpScreen();

    const passwordInput = screen.getByTestId("input-password");
    expect(passwordInput.props.secureTextEntry).toBe(true);

    const toggleButton = screen.getByTestId("toggle-password-visibility");
    fireEvent.press(toggleButton);

    expect(passwordInput.props.secureTextEntry).toBe(false);

    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it("successfully registers, saves token, and redirects to Onboarding", async () => {
    const registerSpy = jest.spyOn(registerApi, "registerUser").mockResolvedValueOnce({
      access_token: "jwt_token_12345",
      token_type: "bearer",
      user: {
        account_type: "common",
        id: 1,
        username: "eduardobastiani"
      }
    });

    const navigation = renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo de Bastiani");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardobastiani");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(registerSpy).toHaveBeenCalledWith({
        email: "eduardo@example.com",
        name: "Eduardo de Bastiani",
        password: "senhaForte123",
        username: "eduardobastiani"
      });
    });

    await waitFor(() => {
      expect(secureStorage.setItem).toHaveBeenCalledWith("auth_token", "jwt_token_12345");
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "Onboarding" }]
      });
    });
  });

  it("displays inline error on username when backend returns 409 conflict for username", async () => {
    jest.spyOn(registerApi, "registerUser").mockRejectedValueOnce(
      new ApiError("CONFLICT", "O nome de usuário já está em uso.", 409, {
        fields: [{ field: "username", message: "Este usuário já está cadastrado." }]
      })
    );

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Este usuário já está cadastrado.")).toBeTruthy();
  });

  it("displays inline error on email when backend returns 409 conflict for email", async () => {
    jest.spyOn(registerApi, "registerUser").mockRejectedValueOnce(
      new ApiError("CONFLICT", "O email já está em uso.", 409, {
        fields: [{ field: "email", message: "Este email já está cadastrado." }]
      })
    );

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "duplicado@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Este email já está cadastrado.")).toBeTruthy();
  });

  it("preserves input values and shows error message on network failure", async () => {
    jest
      .spyOn(registerApi, "registerUser")
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "Unable to reach the API.", 0, null));

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(
      await screen.findByText("Não foi possível conectar ao servidor. Tente novamente.")
    ).toBeTruthy();

    expect(screen.getByTestId("input-name").props.value).toBe("Eduardo");
    expect(screen.getByTestId("input-username").props.value).toBe("eduardo");
    expect(screen.getByTestId("input-email").props.value).toBe("eduardo@example.com");
    expect(screen.getByTestId("input-password").props.value).toBe("senhaForte123");
  });

  it("displays inline error on fields when backend returns 422 validation error", async () => {
    jest.spyOn(registerApi, "registerUser").mockRejectedValueOnce(
      new ApiError("VALIDATION_ERROR", "Dados inválidos", 422, {
        fields: [
          { field: "name", message: "Nome inválido." },
          { field: "username", message: "Usuário reservado." },
          { field: "email", message: "Domínio não permitido." },
          { field: "password", message: "Senha fraca." }
        ]
      })
    );

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Nome inválido.")).toBeTruthy();
    expect(await screen.findByText("Usuário reservado.")).toBeTruthy();
    expect(await screen.findByText("Domínio não permitido.")).toBeTruthy();
    expect(await screen.findByText("Senha fraca.")).toBeTruthy();
  });

  it("handles 409 conflict by message content when details are missing", async () => {
    jest
      .spyOn(registerApi, "registerUser")
      .mockRejectedValueOnce(new ApiError("CONFLICT", "Este nome de usuário já existe", 409, null));

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Este usuário já está cadastrado.")).toBeTruthy();
  });

  it("handles 409 conflict for email by message content when details are missing", async () => {
    jest
      .spyOn(registerApi, "registerUser")
      .mockRejectedValueOnce(
        new ApiError("CONFLICT", "Este email já existe no sistema", 409, null)
      );

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Este email já está cadastrado.")).toBeTruthy();
  });

  it("handles generic 409 conflict message as form error when fields are not recognized", async () => {
    jest
      .spyOn(registerApi, "registerUser")
      .mockRejectedValueOnce(new ApiError("CONFLICT", "Conflito geral de registro.", 409, null));

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Conflito geral de registro.")).toBeTruthy();
  });

  it("handles 500 server error by displaying the error message", async () => {
    jest
      .spyOn(registerApi, "registerUser")
      .mockRejectedValueOnce(
        new ApiError("INTERNAL_SERVER_ERROR", "Erro no servidor interno.", 500, null)
      );

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Erro no servidor interno.")).toBeTruthy();
  });

  it("handles unknown generic error by displaying default network error message", async () => {
    jest.spyOn(registerApi, "registerUser").mockRejectedValueOnce(new Error("Unexpected throw"));

    renderSignUpScreen();

    fireEvent.changeText(screen.getByTestId("input-name"), "Eduardo");
    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-email"), "eduardo@example.com");
    fireEvent.changeText(screen.getByTestId("input-password"), "senhaForte123");

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(
      await screen.findByText("Não foi possível conectar ao servidor. Tente novamente.")
    ).toBeTruthy();
  });

  it("navigates to login when tapping the login link", () => {
    const navigation = renderSignUpScreen();

    fireEvent.press(screen.getByTestId("login-link"));

    expect(navigation.navigate).toHaveBeenCalledWith("Login");
  });
});
