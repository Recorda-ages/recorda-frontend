import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";

import { AUTH_TOKEN_KEY, SPLASH_TIMEOUT_MS, SplashScreen } from "@/features/splash";
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
}

describe("SplashScreen", () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("navigates to Feed when user is regular account", async () => {
    (secureStorage.getItem as jest.Mock).mockResolvedValueOnce("valid-token");
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ account_type: "common" });

    render(<SplashScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("Feed");
    });
    expect(apiClient.get).toHaveBeenCalledWith(
      "/auth/me",
      expect.objectContaining({
        headers: { Authorization: "Bearer valid-token" },
        signal: expect.any(Object)
      })
    );
  });

  it("navigates to Admin when user has admin account type", async () => {
    (secureStorage.getItem as jest.Mock).mockResolvedValueOnce("valid-token");
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ account_type: "admin" });

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

  it("navigates to Login on 3-second timeout and ignores subsequent backend responses", async () => {
    jest.useFakeTimers();
    const delayedUser = createDeferred<{ account_type: string }>();
    (secureStorage.getItem as jest.Mock).mockResolvedValueOnce("valid-token");
    (apiClient.get as jest.Mock).mockReturnValueOnce(delayedUser.promise);

    render(<SplashScreen />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(SPLASH_TIMEOUT_MS);
    });

    expect(mockReplace).toHaveBeenCalledWith("Login");
    expect(mockReplace).toHaveBeenCalledTimes(1);

    await act(async () => {
      delayedUser.resolve({ account_type: "admin" });
      await Promise.resolve();
    });

    expect(mockReplace).toHaveBeenCalledWith("Login");
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(secureStorage.removeItem).not.toHaveBeenCalled();
  });
});
