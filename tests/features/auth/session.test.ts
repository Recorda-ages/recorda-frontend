import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { UserBasicResponse } from "@/features/auth/api/types";
import { recordaCommentsQueryKey, recordaDetailsQueryKey } from "@/features/feed/queryKeys";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/queryKeys";
import {
  LEGACY_ACCOUNT_TYPE_KEY,
  ROLE_KEY,
  clearSession,
  getPostAuthDestination,
  markOnboardingCompleted,
  saveSession,
  updateAccountSession
} from "@/features/auth/session";
import { AUTH_TOKEN_KEY } from "@/services/api/authClient";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api/useAuthImageSource";
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

  it("replaces the persisted token and updates cached account identity after an account edit", async () => {
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, buildUser());

    await updateAccountSession("jwt-renewed", {
      name: "Gabriel Silva",
      username: "gabriel-silva"
    });

    expect(secureStorage.setItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY, "jwt-renewed");
    expect(queryClient.getQueryData(AUTH_TOKEN_QUERY_KEY)).toBe("jwt-renewed");
    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toEqual(
      buildUser({ name: "Gabriel Silva", username: "gabriel-silva" })
    );
  });

  // Nothing observes the cached user, so React Query's default 5-minute garbage
  // collection would drop it mid-session and every screen would lose the user's id.
  it("keeps the current user for the whole session and still removes it on sign out", async () => {
    jest.useFakeTimers();
    try {
      const user = buildUser();

      await saveSession({ access_token: "jwt", token_type: "bearer", user });
      jest.advanceTimersByTime(6 * 60_000);

      expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toEqual(user);

      await clearSession();

      expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it("clears credentials and user-scoped notification data even if storage fails", async () => {
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, buildUser());
    queryClient.setQueryData(["settings"], { is_private: true, language: "pt-BR" });
    queryClient.setQueryData(["admin", "reports", "admin-1"], { items: [{ targetId: "private" }] });
    queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, {
      pageParams: [0],
      pages: [{ items: [{ notification_id: "private-notification" }], unread_count: 1 }]
    });
    queryClient.setQueryData(["feed", "general"], {
      pages: [{ items: [{ recorda_id: "private-recorda" }] }]
    });
    const privateRecordaKey = recordaDetailsQueryKey("private-recorda");
    queryClient.setQueryData(privateRecordaKey, { recorda_id: "private-recorda" });
    const privateCommentsKey = recordaCommentsQueryKey("private-recorda");
    queryClient.setQueryData(privateCommentsKey, [{ content: "private-comment" }]);
    (secureStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error("locked"));

    await expect(clearSession()).resolves.toBeUndefined();

    expect(secureStorage.removeItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
    expect(secureStorage.removeItem).toHaveBeenCalledWith(ROLE_KEY);
    expect(secureStorage.removeItem).toHaveBeenCalledWith(LEGACY_ACCOUNT_TYPE_KEY);
    expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(["settings"])).toBeUndefined();
    expect(queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(["feed", "general"])).toBeUndefined();
    expect(queryClient.getQueryData(privateRecordaKey)).toBeUndefined();
    expect(queryClient.getQueryData(privateCommentsKey)).toBeUndefined();
    expect(queryClient.getQueryData(["admin", "reports", "admin-1"])).toBeUndefined();
  });

  it("clears every query and mutation without deleting the saved language", async () => {
    for (const key of [["profile", "user-1"], ["user-search", "ana"], ["follow"], ["settings"]]) {
      queryClient.setQueryData(key, { private: "previous account" });
    }
    queryClient.getMutationCache().build(queryClient, { mutationKey: ["settings"] });

    await clearSession();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(secureStorage.removeItem).not.toHaveBeenCalledWith("app_language");
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

it("clears all account caches when saving a different account", async () => {
  queryClient.setQueryData(["friends", "followers", "old-user"], ["private"]);
  queryClient.setQueryData(["users", "search", "secret"], ["private"]);
  queryClient.setQueryData(["settings"], { language: "es" });
  queryClient.setQueryData(["music-preferences", "old-user"], { private: true });
  await saveSession({
    access_token: "new-token",
    token_type: "bearer",
    user: buildUser({ user_id: "next-user", language: "en" })
  });
  expect(queryClient.getQueryData(["friends", "followers", "old-user"])).toBeUndefined();
  expect(queryClient.getQueryData(["users", "search", "secret"])).toBeUndefined();
  expect(queryClient.getQueryData(["settings"])).toBeUndefined();
  expect(queryClient.getQueryData(["music-preferences", "old-user"])).toBeUndefined();
  expect(queryClient.getQueryData(AUTH_ME_QUERY_KEY)).toMatchObject({
    user_id: "next-user",
    language: "en"
  });
});

afterEach(() => queryClient.clear());
