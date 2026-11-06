import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useUserProfile } from "@/features/profile/hooks/useUserProfile";
import { profileQueryKey } from "@/features/profile/queryKeys";
import { profileService } from "@/features/profile/services/profileService";
import { ApiError } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: { getUserProfile: jest.fn() }
}));

const mockGetUserProfile = profileService.getUserProfile as jest.Mock;

const clients: QueryClient[] = [];

function renderUseUserProfile(userId: string, enabled?: boolean) {
  // No `retry` default here: the hook's own policy is what is under test.
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retryDelay: 0 } }
  });
  clients.push(client);

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }

  return { client, ...renderHook(() => useUserProfile(userId, enabled), { wrapper }) };
}

beforeEach(() => {
  mockGetUserProfile.mockReset();
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("profileQueryKey", () => {
  it("is the key the #255 asks for", () => {
    expect(profileQueryKey("user-2")).toEqual(["profile", "user-2"]);
  });
});

describe("useUserProfile", () => {
  it("loads the profile under its query key", async () => {
    mockGetUserProfile.mockResolvedValueOnce({ user_id: "user-2" });
    const { client, result } = renderUseUserProfile("user-2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetUserProfile).toHaveBeenCalledWith("user-2", expect.any(AbortSignal));
    expect(client.getQueryData(["profile", "user-2"])).toEqual({ user_id: "user-2" });
  });

  it("does not fetch when disabled", () => {
    const { result } = renderUseUserProfile("user-2", false);

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it("does not fetch without a user id", () => {
    renderUseUserProfile("");

    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it("surfaces a 404 at once, without retrying", async () => {
    mockGetUserProfile.mockRejectedValue(new ApiError("NOT_FOUND", "Not found", 404, null));
    const { result } = renderUseUserProfile("user-2");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
  });

  it("retries a server error once", async () => {
    mockGetUserProfile.mockRejectedValue(new ApiError("SERVER", "Boom", 500, null));
    const { result } = renderUseUserProfile("user-2");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGetUserProfile).toHaveBeenCalledTimes(2);
  });
});
