import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as signInApi from "@/features/auth/api/signIn";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";
import { i18n } from "@/i18n";
import { ApiError } from "@/services/api/errors";
import { secureStorage } from "@/services/storage";
import { paperTheme } from "@/theme";

const mockNavigation = {
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

function renderSignInScreen() {
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
            <SignInScreen />
          </PaperProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );

  return mockNavigation;
}

describe("SignInScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    testQueryClient?.clear();
    testQueryClient = null;
    jest.restoreAllMocks();
  });

  it("renders only username and password fields with recovery and sign-up links", () => {
    renderSignInScreen();

    expect(screen.getByTestId("sign-in-screen")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(screen.getByText("Bem-vindo de volta")).toBeTruthy();
    expect(screen.getByTestId("input-username")).toBeTruthy();
    expect(screen.getByTestId("input-password")).toBeTruthy();
    expect(screen.queryByTestId("input-email")).toBeNull();
    expect(screen.queryByTestId("input-name")).toBeNull();
    expect(screen.getByTestId("forgot-password-link")).toBeTruthy();
    expect(screen.getByTestId("sign-up-link")).toBeTruthy();
  });

  it("keeps submit disabled until username and password are filled", async () => {
    const signInSpy = jest.spyOn(signInApi, "signInUser");
    renderSignInScreen();

    const submitButton = screen.getByTestId("submit-button");

    expect(submitButton).toBeDisabled();
    fireEvent.press(submitButton);
    expect(signInSpy).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    expect(submitButton).toBeDisabled();

    fireEvent.changeText(screen.getByTestId("input-password"), "senha123");

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it("logs in a common account, stores session and redirects to Feed", async () => {
    jest.spyOn(signInApi, "signInUser").mockResolvedValueOnce({
      access_token: "jwt_common",
      token_type: "bearer",
      user: {
        role: "USER",
        user_id: "user-1",
        name: "Eduardo",
        onboarding_completed: true,
        username: "eduardo"
      }
    });

    const navigation = renderSignInScreen();

    fireEvent.changeText(screen.getByTestId("input-username"), " eduardo ");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha123");

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toBeEnabled();
    });

    fireEvent.press(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(signInApi.signInUser).toHaveBeenCalledWith({
        password: "senha123",
        username: "eduardo"
      });
    });

    expect(secureStorage.setItem).toHaveBeenCalledWith("auth_token", "jwt_common");
    expect(secureStorage.setItem).toHaveBeenCalledWith("role", "USER");
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "Feed" }]
    });
  });

  it("logs in a common account without completed onboarding and redirects to Onboarding", async () => {
    jest.spyOn(signInApi, "signInUser").mockResolvedValueOnce({
      access_token: "jwt_common",
      token_type: "bearer",
      user: {
        role: "USER",
        user_id: "user-1",
        name: "Eduardo",
        onboarding_completed: false,
        username: "eduardo"
      }
    });

    const navigation = renderSignInScreen();

    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha123");

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toBeEnabled();
    });

    fireEvent.press(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "OnboardingArtists" }]
      });
    });
  });

  it("logs in an admin account and redirects to Admin", async () => {
    jest.spyOn(signInApi, "signInUser").mockResolvedValueOnce({
      access_token: "jwt_admin",
      token_type: "bearer",
      user: {
        role: "ADMIN",
        user_id: "user-2",
        name: "Admin",
        onboarding_completed: false,
        username: "admin"
      }
    });

    const navigation = renderSignInScreen();

    fireEvent.changeText(screen.getByTestId("input-username"), "admin");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha123");

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toBeEnabled();
    });

    fireEvent.press(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: "Admin" }]
      });
    });
  });

  it("shows a single generic error for invalid credentials", async () => {
    jest
      .spyOn(signInApi, "signInUser")
      .mockRejectedValueOnce(new ApiError("UNAUTHORIZED", "Senha incorreta", 401, null));

    renderSignInScreen();

    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha-errada");

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toBeEnabled();
    });

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Usuário ou senha inválidos.")).toBeTruthy();
    expect(screen.queryByText("Senha incorreta")).toBeNull();
    expect(mockNavigation.reset).not.toHaveBeenCalled();
  });

  it("shows a retry message instead of invalid credentials when the server fails", async () => {
    jest
      .spyOn(signInApi, "signInUser")
      .mockRejectedValueOnce(new ApiError("INTERNAL_SERVER_ERROR", "Erro interno", 500, null));

    renderSignInScreen();

    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha123");

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toBeEnabled();
    });

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(await screen.findByText("Não foi possível entrar. Tente novamente.")).toBeTruthy();
    expect(screen.queryByText("Usuário ou senha inválidos.")).toBeNull();
  });

  it("preserves fields and shows network error when the request cannot reach the API", async () => {
    jest
      .spyOn(signInApi, "signInUser")
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "Unable to reach API", 0, null));

    renderSignInScreen();

    fireEvent.changeText(screen.getByTestId("input-username"), "eduardo");
    fireEvent.changeText(screen.getByTestId("input-password"), "senha123");

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).toBeEnabled();
    });

    fireEvent.press(screen.getByTestId("submit-button"));

    expect(
      await screen.findByText("Não foi possível conectar ao servidor. Tente novamente.")
    ).toBeTruthy();
    expect(screen.getByTestId("input-username").props.value).toBe("eduardo");
    expect(screen.getByTestId("input-password").props.value).toBe("senha123");
  });

  it("navigates to recovery and sign-up from their links", () => {
    const navigation = renderSignInScreen();

    fireEvent.press(screen.getByTestId("forgot-password-link"));
    expect(navigation.navigate).toHaveBeenCalledWith("PasswordRecovery");

    fireEvent.press(screen.getByTestId("sign-up-link"));
    expect(navigation.navigate).toHaveBeenCalledWith("SignUp");
  });
});
