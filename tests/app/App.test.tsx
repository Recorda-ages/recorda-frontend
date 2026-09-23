import { fireEvent, render, screen } from "@testing-library/react-native";

import App from "../../App";
import { SPLASH_MIN_DURATION_MS } from "@/features/splash";
import { secureStorage } from "@/services/storage/secureStorage";

const LOGIN_WAIT_TIMEOUT = SPLASH_MIN_DURATION_MS + 1000;

jest.mock("@/services/storage/secureStorage", () => ({
  secureStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

const mockGetItem = secureStorage.getItem as jest.Mock;

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
  });

  it("renders the splash screen before routing unauthenticated users to login", async () => {
    render(<App />);

    expect(screen.getByTestId("splash-screen-container")).toBeTruthy();
    expect(screen.getByText("recorda.")).toBeTruthy();
    expect(await screen.findByTestId("login-screen", {}, { timeout: LOGIN_WAIT_TIMEOUT })).toBeTruthy();
  });

  it("opens password recovery from the login forgot password link", async () => {
    render(<App />);

    expect(await screen.findByTestId("login-screen", {}, { timeout: LOGIN_WAIT_TIMEOUT })).toBeTruthy();

    fireEvent.press(screen.getByTestId("forgot-password-link"));
    expect(await screen.findByTestId("password-recovery-screen")).toBeTruthy();
  });
});
