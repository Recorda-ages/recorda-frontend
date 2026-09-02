import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";

import { SplashScreen, AUTH_TOKEN_KEY } from "@/features/splash";
import { apiClient } from "@/services/api/client";
import { secureStorage } from "@/services/storage/secureStorage";

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn()
}));

jest.mock("@/services/api/client", () => ({
  apiClient: {
    get: jest.fn()
  }
}));

jest.mock("@/services/storage/secureStorage", () => ({
  secureStorage: {
    getItem: jest.fn(),
    removeItem: jest.fn()
  }
}));

describe("SplashScreen", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useNavigation as jest.Mock).mockReturnValue({ replace: mockReplace });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders correctly with branding text", () => {
    const { getByText, getByTestId } = render(<SplashScreen />);
    expect(getByTestId("splash-screen-container")).toBeTruthy();
    expect(getByText("recorda.")).toBeTruthy();
  });

  it("navigates to Login when there is no saved session", async () => {
    (secureStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    render(<SplashScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("Login");
    });
  });

  it("navigates to Feed when user is regular account", async () => {
    (secureStorage.getItem as jest.Mock).mockResolvedValueOnce("valid-token");
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ role: "user" });

    render(<SplashScreen />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/auth/me", {
        headers: { Authorization: "Bearer valid-token" }
      });
      expect(mockReplace).toHaveBeenCalledWith("Feed");
    });
  });

  it("navigates to Admin when user has admin role", async () => {
    (secureStorage.getItem as jest.Mock).mockResolvedValueOnce("valid-token");
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ role: "admin" });

    render(<SplashScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("Admin");
    });
  });

  it("clears session and navigates to Login when token is invalid", async () => {
    (secureStorage.getItem as jest.Mock).mockResolvedValueOnce("bad-token");
    (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error("Unauthorized"));

    render(<SplashScreen />);

    await waitFor(() => {
      expect(secureStorage.removeItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
      expect(mockReplace).toHaveBeenCalledWith("Login");
    });
  });

  it("navigates to Login on 3-second timeout and ignores subsequent responses", async () => {
    (secureStorage.getItem as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<SplashScreen />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockReplace).toHaveBeenCalledWith("Login");
    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
