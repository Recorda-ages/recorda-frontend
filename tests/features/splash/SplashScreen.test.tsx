import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { useNavigation } from "@react-navigation/native";

import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY, getCurrentUser } from "@/features/auth/api/getCurrentUser";
import { AUTH_TOKEN_KEY, SPLASH_TIMEOUT_MS, SplashScreen } from "@/features/splash";
import { ApiError } from "@/services/api/errors";
import { secureStorage } from "@/services/storage/secureStorage";

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn()
}));

jest.mock("@/features/auth/api/getCurrentUser", () => ({
  AUTH_ME_QUERY_KEY: ["auth", "me"],
  getCurrentUser: jest.fn()
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
  const mockGetItem = secureStorage.getItem as jest.Mock;
  const mockRemoveItem = secureStorage.removeItem as jest.Mock;
  const mockGetCurrentUser = getCurrentUser as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    mockGetItem.mockResolvedValue(null);
    mockRemoveItem.mockResolvedValue(undefined);
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
    mockGetItem.mockResolvedValueOnce(null);

    render(<SplashScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("Login");
    });
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("navigates to Feed when user is regular account", async () => {
    mockGetItem.mockResolvedValueOnce("valid-token");
    const user = { account_type: "common", id: 1, username: "gabriel" };
    mockGetCurrentUser.mockResolvedValueOnce(user);

    render(<SplashScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("Feed");
    });
    expect(getCurrentUser).toHaveBeenCalledWith("valid-token", expect.any(Object));
    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toEqual(user);
  });

  it("navigates to Admin when user has admin account type", async () => {
    mockGetItem.mockResolvedValueOnce("valid-token");
    mockGetCurrentUser.mockResolvedValueOnce({ account_type: "admin", id: 2, username: "admin" });

    render(<SplashScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("Admin");
    });
  });

  it("clears session and navigates to Login when token is invalid", async () => {
    mockGetItem.mockResolvedValueOnce("bad-token");
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, {
      account_type: "common",
      id: 1,
      username: "gabriel"
    });
    mockGetCurrentUser.mockRejectedValueOnce(
      new ApiError("UNAUTHORIZED", "Unauthorized", 401, null)
    );

    render(<SplashScreen />);

    await waitFor(() => {
      expect(secureStorage.removeItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
      expect(mockReplace).toHaveBeenCalledWith("Login");
    });
    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
  });

  it("navigates to Login on 3-second timeout and ignores subsequent backend responses", async () => {
    const delayedUser = createDeferred<{ account_type: string; id: number; username: string }>();
    mockGetItem.mockResolvedValueOnce("valid-token");
    mockGetCurrentUser.mockReturnValueOnce(delayedUser.promise);

    render(<SplashScreen />);

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
    });

    await waitFor(
      () => {
        expect(mockReplace).toHaveBeenCalledWith("Login");
      },
      { timeout: SPLASH_TIMEOUT_MS + 3000 }
    );
    expect(mockReplace).toHaveBeenCalledTimes(1);

    delayedUser.resolve({ account_type: "admin", id: 2, username: "admin" });
    await Promise.resolve();
    await Promise.resolve();

    expect(mockReplace).toHaveBeenCalledWith("Login");
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(secureStorage.removeItem).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
  });
});
