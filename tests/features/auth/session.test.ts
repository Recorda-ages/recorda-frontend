import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import {
  LEGACY_ACCOUNT_TYPE_KEY,
  ROLE_KEY,
  clearSession,
  getPostAuthDestination,
  markOnboardingCompleted,
  saveSession
} from "@/features/auth/session";
import { AUTH_TOKEN_KEY } from "@/services/api/authClient";
import { secureStorage } from "@/services/storage";

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(),
    removeItem: jest.fn(async () => undefined),
    setItem: jest.fn(async () => undefined)
  }
}));

function buildUser(overrides: Partial<UserBasicResponse> = {}): UserBasicResponse {
  return {
    role: "USER",
    user_id: "user-1",
    name: "Gabriel",
    onboarding_completed: false,
    username: "gabriel",
    ...overrides
  };
}

describe("auth session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("stores the token, account type and current user", async () => {
    const user = buildUser();

    await saveSession({ access_token: "jwt", token_type: "bearer", user });

    expect(secureStorage.setItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY, "jwt");
    expect(secureStorage.setItem).toHaveBeenCalledWith(ROLE_KEY, "USER");
    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toEqual(user);
  });

  it("clears stored credentials and the cached user even if storage fails", async () => {
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, buildUser());
    (secureStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error("locked"));

    await expect(clearSession()).resolves.toBeUndefined();

    expect(secureStorage.removeItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
    expect(secureStorage.removeItem).toHaveBeenCalledWith(ROLE_KEY);
    expect(secureStorage.removeItem).toHaveBeenCalledWith(LEGACY_ACCOUNT_TYPE_KEY);
    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
  });

  it.each([
    [buildUser({ role: "ADMIN" }), "Admin"],
    [buildUser({ onboarding_completed: true }), "Feed"],
    [buildUser({ onboarding_completed: false }), "OnboardingArtists"]
  ])("routes %o to %s", (user, destination) => {
    expect(getPostAuthDestination(user)).toBe(destination);
  });

  it("marks the cached user as onboarded", () => {
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, buildUser());

    markOnboardingCompleted();

    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toEqual(
      expect.objectContaining({ onboarding_completed: true })
    );
  });

  it("does nothing when there is no cached user to mark", () => {
    markOnboardingCompleted();

    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
  });
});
