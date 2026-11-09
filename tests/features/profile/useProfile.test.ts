import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { AUTH_ME_QUERY_KEY, type CurrentUser } from "@/features/auth/api/getCurrentUser";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { mockOpenProfile, mockOwnProfile } from "@/features/profile/mocks/profileMocks";
import { profileService } from "@/features/profile/services/profileService";
import { ApiError } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: { getMyProfile: jest.fn(), getUserProfile: jest.fn() }
}));

const mockGetMyProfile = profileService.getMyProfile as jest.Mock;
const mockGetUserProfile = profileService.getUserProfile as jest.Mock;

const ME: CurrentUser = {
  name: "Natalia",
  onboarding_completed: true,
  role: "USER",
  user_id: mockOwnProfile.user_id,
  username: "natalia"
};

const clients: QueryClient[] = [];

function renderUseProfile(userId: string, enabled = true, currentUser: CurrentUser | null = ME) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retryDelay: 0, staleTime: Infinity } }
  });
  clients.push(client);
  if (currentUser) client.setQueryData(AUTH_ME_QUERY_KEY, currentUser);

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }

  return { client, ...renderHook(() => useProfile(userId, enabled), { wrapper }) };
}

beforeEach(() => {
  mockGetMyProfile.mockReset();
  mockGetUserProfile.mockReset();
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("useProfile", () => {
  it("loads another user's profile by id under ['profile', id]", async () => {
    mockGetUserProfile.mockResolvedValueOnce(mockOpenProfile);
    const { client, result } = renderUseProfile(mockOpenProfile.user_id);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetUserProfile).toHaveBeenCalledWith(
      mockOpenProfile.user_id,
      expect.any(AbortSignal)
    );
    expect(mockGetMyProfile).not.toHaveBeenCalled();
    expect(client.getQueryData(["profile", mockOpenProfile.user_id])).toEqual(mockOpenProfile);
  });

  it("resolves 'me' to the real user id from the /auth/me cache", async () => {
    mockGetMyProfile.mockResolvedValueOnce(mockOwnProfile);
    const { client, result } = renderUseProfile("me");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetUserProfile).not.toHaveBeenCalled();
    expect(client.getQueryData(["profile", ME.user_id])).toEqual(mockOwnProfile);
    expect(client.getQueryData(["profile", "me"])).toBeUndefined();
  });

  it("shares one cache entry between 'me' and the real user id", async () => {
    mockGetMyProfile.mockResolvedValueOnce(mockOwnProfile);
    const { client, result } = renderUseProfile("me");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const byId = renderHook(() => useProfile(ME.user_id), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client }, children)
    });

    expect(byId.result.current.data).toEqual(mockOwnProfile);
  });

  it("waits for the signed-in user before resolving 'me'", () => {
    const { result } = renderUseProfile("me", true, null);

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });

  it("does not request anything while disabled", () => {
    const { result } = renderUseProfile(mockOpenProfile.user_id, false);

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404])("does not retry a %i of another profile", async (status) => {
    mockGetUserProfile.mockRejectedValue(new ApiError("ERR", "No", status, null));
    const { result } = renderUseProfile(mockOpenProfile.user_id);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
  });

  it("retries a 409 of another profile once, but not the own profile's 409", async () => {
    mockGetUserProfile.mockRejectedValue(new ApiError("CONFLICT", "No", 409, null));
    const other = renderUseProfile(mockOpenProfile.user_id);
    await waitFor(() => expect(other.result.current.isError).toBe(true));
    expect(mockGetUserProfile).toHaveBeenCalledTimes(2);

    mockGetMyProfile.mockRejectedValue(new ApiError("CONFLICT", "Onboarding", 409, null));
    const own = renderUseProfile("me");
    await waitFor(() => expect(own.result.current.isError).toBe(true));
    expect(mockGetMyProfile).toHaveBeenCalledTimes(1);
  });
});
