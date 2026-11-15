import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { isIncompleteProfileError, useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { profileQueryKey, profileRecordasQueryKey } from "@/features/profile/queryKeys";
import { profileService } from "@/features/profile/services/profileService";
import { ApiError } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: { getMyProfile: jest.fn(), getUserRecordas: jest.fn() }
}));

const mockGetMyProfile = profileService.getMyProfile as jest.Mock;

const ME: CurrentUser = {
  name: "Natalia",
  onboarding_completed: true,
  role: "USER",
  user_id: "user-1",
  username: "natalia"
};

const clients: QueryClient[] = [];

function renderUseMyProfile(currentUser: CurrentUser | null = ME) {
  // No `retry` default here: the hook's own policy is what is under test.
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retryDelay: 0 } }
  });
  clients.push(client);
  if (currentUser) {
    client.setQueryData(AUTH_ME_QUERY_KEY, currentUser);
  }

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }

  return { client, ...renderHook(() => useMyProfile(), { wrapper }) };
}

beforeEach(() => {
  mockGetMyProfile.mockReset();
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("profile query keys", () => {
  it("key a profile and its grid by user id, the grid under the profile", () => {
    expect(profileQueryKey("user-1")).toEqual(["profile", "user-1"]);
    expect(profileRecordasQueryKey("user-1")).toEqual(["profile", "user-1", "recordas"]);
  });
});

describe("useMyProfile", () => {
  it("caches the own profile under the real user id, not 'me'", async () => {
    mockGetMyProfile.mockResolvedValueOnce({ user_id: "user-1" });
    const { client, result } = renderUseMyProfile();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMyProfile).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(client.getQueryData(["profile", "user-1"])).toEqual({ user_id: "user-1" });
    expect(client.getQueryData(["profile", "me"])).toBeUndefined();
  });

  it("waits while the signed-in user isn't known", () => {
    const { result } = renderUseMyProfile(null);

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });

  it("surfaces the onboarding 409 at once, without retrying", async () => {
    mockGetMyProfile.mockRejectedValue(new ApiError("CONFLICT", "Onboarding", 409, null));
    const { result } = renderUseMyProfile();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(isIncompleteProfileError(result.current.error)).toBe(true);
    expect(mockGetMyProfile).toHaveBeenCalledTimes(1);
  });

  it("retries a server error once", async () => {
    mockGetMyProfile.mockRejectedValue(new ApiError("SERVER", "Boom", 500, null));
    const { result } = renderUseMyProfile();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(isIncompleteProfileError(result.current.error)).toBe(false);
    expect(mockGetMyProfile).toHaveBeenCalledTimes(2);
  });
});

describe("isIncompleteProfileError", () => {
  it("recognizes only the API 409", () => {
    expect(isIncompleteProfileError(new ApiError("CONFLICT", "x", 409, null))).toBe(true);
    expect(isIncompleteProfileError(new ApiError("NOT_FOUND", "x", 404, null))).toBe(false);
    expect(isIncompleteProfileError(new Error("409"))).toBe(false);
    expect(isIncompleteProfileError(undefined)).toBe(false);
  });
});
