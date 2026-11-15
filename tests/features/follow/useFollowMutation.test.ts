import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useFollowMutation } from "@/features/follow/hooks/useFollowMutation";
import { followService } from "@/features/follow/services/followService";
import type { FollowStatus } from "@/features/follow/types";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { resetPrivateState } from "@/services/api/sessionLifecycle";

jest.mock("@/features/follow/services/followService", () => ({
  followService: { follow: jest.fn(), unfollow: jest.fn() }
}));

const mockFollow = followService.follow as jest.Mock;
const mockUnfollow = followService.unfollow as jest.Mock;

// Por padrão o React Query agenda as notificações num macrotask, que cai fora do
// `act` e polui a saída com avisos. Notificar de forma síncrona mantém tudo dentro.
notifyManager.setScheduler((callback) => callback());

const SEARCH_KEY = ["users", "search", "jane"];

type CachedUser = {
  avatar_url: string | null;
  follow_status: FollowStatus;
  user_id: string;
  username: string;
};

function buildCache(status: FollowStatus): CachedUser[] {
  return [
    {
      avatar_url: "/media/jane.png",
      follow_status: status,
      user_id: "user-1",
      username: "jane_doe"
    },
    {
      avatar_url: null,
      follow_status: "nenhuma",
      user_id: "user-2",
      username: "anne_wilson"
    }
  ];
}

const clients: QueryClient[] = [];

function setup(status: FollowStatus) {
  const client = new QueryClient({
    defaultOptions: {
      // gcTime 0: a finished mutation otherwise schedules a 5-minute cleanup timer that
      // outlives the test and keeps Jest from exiting.
      mutations: { gcTime: 0, retry: false },
      queries: { gcTime: Infinity, retry: false }
    }
  });
  clients.push(client);
  client.setQueryData(SEARCH_KEY, buildCache(status));

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }

  const { result } = renderHook(() => useFollowMutation(), { wrapper });

  return { client, result };
}

function cachedUser(client: QueryClient, userId: string) {
  return client.getQueryData<CachedUser[]>(SEARCH_KEY)?.find((u) => u.user_id === userId);
}

/** Promise que só resolve quando o teste mandar, para inspecionar o meio do voo. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

beforeEach(() => {
  mockFollow.mockReset();
  mockUnfollow.mockReset();
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("useFollowMutation", () => {
  // US20: "Conta pública muda para Seguindo imediatamente" + "Usar atualização otimista".
  it("flips the cached user to seguindo before the request settles", async () => {
    const pending = deferred<{ follow_status: FollowStatus }>();
    mockFollow.mockReturnValueOnce(pending.promise);
    const { client, result } = setup("nenhuma");

    act(() => result.current.mutate({ action: "follow", userId: "user-1" }));

    // A request ainda não respondeu e o cache já mudou: isso é o otimismo.
    await waitFor(() => expect(cachedUser(client, "user-1")?.follow_status).toBe("seguindo"));
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      pending.resolve({ follow_status: "seguindo" });
      await pending.promise;
    });
  });

  it("leaves the other cached users untouched", async () => {
    mockFollow.mockResolvedValueOnce({ follow_status: "seguindo" });
    const { client, result } = setup("nenhuma");

    await act(async () => {
      await result.current.mutateAsync({ action: "follow", userId: "user-1" });
    });

    expect(cachedUser(client, "user-2")).toEqual({
      avatar_url: null,
      follow_status: "nenhuma",
      user_id: "user-2",
      username: "anne_wilson"
    });
  });

  // US20: "Conta privada muda para Solicitado". Cobertura parcial: o cliente não
  // sabe que a conta é privada (o backend não expõe `is_private` na busca), então
  // o que dá para garantir é a reconciliação com a resposta do servidor.
  it("reconciles to solicitado when the server answers that the account is private", async () => {
    mockFollow.mockResolvedValueOnce({ follow_status: "solicitado" });
    const { client, result } = setup("nenhuma");

    await act(async () => {
      await result.current.mutateAsync({ action: "follow", userId: "user-1" });
    });

    expect(cachedUser(client, "user-1")?.follow_status).toBe("solicitado");
  });

  // US20: "Solicitado pode ser cancelado".
  it("cancels a pending request through unfollow and clears the relationship", async () => {
    mockUnfollow.mockResolvedValueOnce({ follow_status: "nenhuma" });
    const { client, result } = setup("solicitado");

    await act(async () => {
      await result.current.mutateAsync({ action: "unfollow", userId: "user-1" });
    });

    expect(mockUnfollow).toHaveBeenCalledWith("user-1");
    expect(mockFollow).not.toHaveBeenCalled();
    expect(cachedUser(client, "user-1")?.follow_status).toBe("nenhuma");
  });

  // US20: "Em erro, reconciliar estado com o backend". É o teste central da feature:
  // hoje a rota nem existe (BE#43), então este é o caminho que roda de verdade.
  it("restores the exact previous cache when the request fails", async () => {
    mockFollow.mockRejectedValueOnce(new Error("404"));
    const { client, result } = setup("nenhuma");
    const before = client.getQueryData<CachedUser[]>(SEARCH_KEY);

    await act(async () => {
      await result.current
        .mutateAsync({ action: "follow", userId: "user-1" })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(client.getQueryData<CachedUser[]>(SEARCH_KEY)).toEqual(before);
  });

  it("restores the cache when unfollow fails", async () => {
    mockUnfollow.mockRejectedValueOnce(new Error("404"));
    const { client, result } = setup("seguindo");

    await act(async () => {
      await result.current
        .mutateAsync({ action: "unfollow", userId: "user-1" })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cachedUser(client, "user-1")?.follow_status).toBe("seguindo");
  });

  it("does not roll back another user's concurrent successful mutation", async () => {
    const first = deferred<{ follow_status: FollowStatus }>();
    const second = deferred<{ follow_status: FollowStatus }>();
    mockFollow.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { client, result } = setup("nenhuma");

    act(() => {
      result.current.mutate({ action: "follow", userId: "user-1" });
      result.current.mutate({ action: "follow", userId: "user-2" });
    });

    await waitFor(() => {
      expect(cachedUser(client, "user-1")?.follow_status).toBe("seguindo");
      expect(cachedUser(client, "user-2")?.follow_status).toBe("seguindo");
    });

    await act(async () => {
      second.resolve({ follow_status: "seguindo" });
      await second.promise;
      first.reject(new Error("404"));
      await first.promise.catch(() => undefined);
    });

    await waitFor(() => expect(cachedUser(client, "user-1")?.follow_status).toBe("nenhuma"));
    expect(cachedUser(client, "user-2")?.follow_status).toBe("seguindo");
  });

  // O prefixo `["users"]` também alcança caches que não são lista (por exemplo
  // `["users","me"]`); eles não podem ser corrompidos pelo patch otimista.
  it("leaves non-list caches under the users prefix untouched", async () => {
    mockFollow.mockResolvedValueOnce({ follow_status: "seguindo" });
    const { client, result } = setup("nenhuma");
    const profile = { user_id: "user-9", username: "me" };
    client.setQueryData(["users", "me"], profile);

    await act(async () => {
      await result.current.mutateAsync({ action: "follow", userId: "user-1" });
    });

    expect(client.getQueryData(["users", "me"])).toEqual(profile);
  });

  it("keeps the optimistic value when the endpoint answers 204 with no body", async () => {
    mockUnfollow.mockResolvedValueOnce(null);
    const { client, result } = setup("seguindo");

    await act(async () => {
      await result.current.mutateAsync({ action: "unfollow", userId: "user-1" });
    });

    expect(cachedUser(client, "user-1")?.follow_status).toBe("nenhuma");
  });

  it.each([
    ["success", () => mockFollow.mockResolvedValueOnce({ follow_status: "seguindo" })],
    ["failure", () => mockFollow.mockRejectedValueOnce(new Error("404"))]
  ])("invalidates the cached user lists after a %s", async (_label, arrange) => {
    arrange();
    const { client, result } = setup("nenhuma");
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current
        .mutateAsync({ action: "follow", userId: "user-1" })
        .catch(() => undefined);
    });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["users"] }));
  });

  it("refreshes suggestions after an unfollow so the profile can come back", async () => {
    mockUnfollow.mockResolvedValueOnce({ follow_status: "nenhuma" });
    const { client, result } = setup("seguindo");
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({ action: "unfollow", userId: "user-1" });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["suggestions", "users"] });
  });

  it.each([
    ["follow", () => mockFollow.mockResolvedValueOnce({ follow_status: "solicitado" })],
    ["unfollow", () => mockUnfollow.mockResolvedValueOnce({ follow_status: "nenhuma" })]
  ] as const)(
    "refreshes only the target's profile after a successful %s",
    async (action, arrange) => {
      arrange();
      const { client, result } = setup(action === "follow" ? "nenhuma" : "seguindo");
      const invalidateSpy = jest.spyOn(client, "invalidateQueries");

      await act(async () => {
        await result.current.mutateAsync({ action, userId: "user-1" });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ exact: true, queryKey: ["profile", "user-1"] });
      expect(invalidateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["profile", "user-2"] })
      );
    }
  );

  it("refreshes the target's profile but not its Recordas grid", async () => {
    mockUnfollow.mockResolvedValueOnce({ follow_status: "nenhuma" });
    const { client, result } = setup("seguindo");
    client.setQueryData(["profile", "user-1"], { user_id: "user-1" });
    client.setQueryData(["profile", "user-1", "recordas"], { pageParams: [null], pages: [] });

    await act(async () => {
      await result.current.mutateAsync({ action: "unfollow", userId: "user-1" });
    });

    // Losing access must not trigger a request for the grid it can no longer see.
    expect(client.getQueryState(["profile", "user-1"])?.isInvalidated).toBe(true);
    expect(client.getQueryState(["profile", "user-1", "recordas"])?.isInvalidated).toBe(false);
  });

  it("keeps suggestions as they are after a follow", async () => {
    mockFollow.mockResolvedValueOnce({ follow_status: "seguindo" });
    const { client, result } = setup("nenhuma");
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync({ action: "follow", userId: "user-1" });
    });

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ["suggestions", "users"] });
  });
});

describe("profiles after a follow change", () => {
  const TARGET_PROFILE = ["profile", "user-1"];
  const TARGET_GRID = ["profile", "user-1", "recordas"];
  const OWN_PROFILE = ["profile", "me"];
  const OWN_GRID = ["profile", "me", "recordas"];
  const OTHER_PROFILE = ["profile", "user-9"];
  const OTHER_GRID = ["profile", "user-9", "recordas"];

  function profile(overrides: Record<string, unknown> = {}) {
    return {
      can_view_content: true,
      counts: { followers: 10, following: 5, recordas: 3 },
      is_private: false,
      user_id: "user-1",
      ...overrides
    };
  }

  // Real cache: every profile and grid exists, so each test can say which were touched.
  function setupProfiles(target = profile()) {
    const { client, result } = setup("nenhuma");
    client.setQueryData(AUTH_ME_QUERY_KEY, { role: "USER", user_id: "me" });
    client.setQueryData(TARGET_PROFILE, target);
    client.setQueryData(OWN_PROFILE, profile({ user_id: "me" }));
    client.setQueryData(OTHER_PROFILE, profile({ user_id: "user-9" }));
    for (const key of [TARGET_GRID, OWN_GRID, OTHER_GRID]) {
      client.setQueryData(key, { pageParams: [null], pages: [] });
    }
    return { client, result };
  }

  function invalidated(client: QueryClient, key: readonly unknown[]) {
    return client.getQueryState(key)?.isInvalidated;
  }

  async function run(
    result: ReturnType<typeof setup>["result"],
    input: Parameters<ReturnType<typeof useFollowMutation>["mutateAsync"]>[0]
  ) {
    await act(async () => {
      await result.current.mutateAsync(input).catch(() => undefined);
    });
  }

  it("following a public account refreshes both profiles, not their grids", async () => {
    mockFollow.mockResolvedValueOnce({ follow_status: "seguindo" });
    const { client, result } = setupProfiles();

    await run(result, { action: "follow", userId: "user-1" });

    expect(invalidated(client, TARGET_PROFILE)).toBe(true);
    expect(invalidated(client, OWN_PROFILE)).toBe(true);
    expect(invalidated(client, TARGET_GRID)).toBe(false);
    expect(invalidated(client, OWN_GRID)).toBe(false);
    expect(invalidated(client, OTHER_PROFILE)).toBe(false);
    expect(invalidated(client, OTHER_GRID)).toBe(false);
  });

  it("following a private account (request) leaves the own counter alone", async () => {
    mockFollow.mockResolvedValueOnce({ follow_status: "solicitado" });
    const { client, result } = setupProfiles(
      profile({ can_view_content: false, is_private: true })
    );

    await run(result, { action: "follow", userId: "user-1" });

    expect(invalidated(client, TARGET_PROFILE)).toBe(true);
    expect(invalidated(client, OWN_PROFILE)).toBe(false);
  });

  it("unfollowing refreshes both profiles", async () => {
    mockUnfollow.mockResolvedValueOnce({ follow_status: "nenhuma" });
    const { client, result } = setupProfiles();

    await run(result, { action: "unfollow", previousStatus: "seguindo", userId: "user-1" });

    expect(invalidated(client, TARGET_PROFILE)).toBe(true);
    expect(invalidated(client, OWN_PROFILE)).toBe(true);
    expect(invalidated(client, OWN_GRID)).toBe(false);
  });

  it("cancelling a request refreshes the target but not the own counter", async () => {
    mockUnfollow.mockResolvedValueOnce({ follow_status: "nenhuma" });
    const { client, result } = setupProfiles(
      profile({ can_view_content: false, is_private: true })
    );

    await run(result, { action: "unfollow", previousStatus: "solicitado", userId: "user-1" });

    expect(invalidated(client, TARGET_PROFILE)).toBe(true);
    expect(invalidated(client, OWN_PROFILE)).toBe(false);
  });

  it("refreshes the own profile when the previous status is unknown", async () => {
    mockUnfollow.mockResolvedValueOnce({ follow_status: "nenhuma" });
    const { client, result } = setupProfiles();

    await run(result, { action: "unfollow", userId: "user-1" });

    expect(invalidated(client, OWN_PROFILE)).toBe(true);
  });

  it("does not refresh the own profile when the mutation fails", async () => {
    mockFollow.mockRejectedValueOnce(new Error("offline"));
    const { client, result } = setupProfiles();

    await run(result, { action: "follow", userId: "user-1" });

    expect(invalidated(client, OWN_PROFILE)).toBe(false);
  });

  it("touches no profile when the session changes during the mutation", async () => {
    const request = deferred<{ follow_status: FollowStatus }>();
    mockUnfollow.mockReturnValueOnce(request.promise);
    const { client, result } = setupProfiles();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current
        .mutateAsync({ action: "unfollow", previousStatus: "seguindo", userId: "user-1" })
        .catch(() => undefined);
    });
    await waitFor(() => expect(mockUnfollow).toHaveBeenCalled());
    resetPrivateState(); // sign out / account switch while the request is in flight
    await act(async () => {
      request.resolve({ follow_status: "nenhuma" });
      await pending;
    });

    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(["profile"]) })
    );
  });

  describe("unfollowing a private account the viewer could see", () => {
    const VISIBLE_PRIVATE = profile({ is_private: true });

    it("marks the cached profile restricted at once, before the server answers", async () => {
      const request = deferred<{ follow_status: FollowStatus }>();
      mockUnfollow.mockReturnValueOnce(request.promise);
      const { client, result } = setupProfiles(VISIBLE_PRIVATE);

      act(() => {
        void result.current
          .mutateAsync({ action: "unfollow", previousStatus: "seguindo", userId: "user-1" })
          .catch(() => undefined);
      });

      await waitFor(() =>
        expect(client.getQueryData(TARGET_PROFILE)).toMatchObject({
          can_view_content: false,
          counts: null
        })
      );
      await act(async () => request.resolve({ follow_status: "nenhuma" }));
    });

    it("restores the profile when the unfollow fails", async () => {
      mockUnfollow.mockRejectedValueOnce(new Error("offline"));
      const { client, result } = setupProfiles(VISIBLE_PRIVATE);

      await run(result, { action: "unfollow", previousStatus: "seguindo", userId: "user-1" });

      expect(client.getQueryData(TARGET_PROFILE)).toEqual(VISIBLE_PRIVATE);
    });

    it("leaves public profiles and other users' profiles as they were", async () => {
      const request = deferred<{ follow_status: FollowStatus }>();
      mockUnfollow.mockReturnValueOnce(request.promise);
      const { client, result } = setupProfiles(profile());

      act(() => {
        void result.current
          .mutateAsync({ action: "unfollow", previousStatus: "seguindo", userId: "user-1" })
          .catch(() => undefined);
      });
      await waitFor(() => expect(mockUnfollow).toHaveBeenCalled());

      expect(client.getQueryData(TARGET_PROFILE)).toMatchObject({ can_view_content: true });
      expect(client.getQueryData(OTHER_PROFILE)).toMatchObject({ can_view_content: true });
      await act(async () => request.resolve({ follow_status: "nenhuma" }));
    });

    it("doesn't put the old profile back when the session changed before the failure", async () => {
      const request = deferred<{ follow_status: FollowStatus }>();
      mockUnfollow.mockReturnValueOnce(request.promise);
      const { client, result } = setupProfiles(VISIBLE_PRIVATE);

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current
          .mutateAsync({ action: "unfollow", previousStatus: "seguindo", userId: "user-1" })
          .catch(() => undefined);
      });
      await waitFor(() => expect(mockUnfollow).toHaveBeenCalled());
      // Sign out / account switch: the next account starts from an empty cache.
      resetPrivateState();
      client.clear();
      await act(async () => {
        request.reject(new Error("offline"));
        await pending;
      });

      expect(client.getQueryData(TARGET_PROFILE)).toBeUndefined();
    });

    it("keeps a profile that arrived during the request instead of rolling it back", async () => {
      const request = deferred<{ follow_status: FollowStatus }>();
      mockUnfollow.mockReturnValueOnce(request.promise);
      const { client, result } = setupProfiles(VISIBLE_PRIVATE);

      let pending: Promise<unknown> = Promise.resolve();
      act(() => {
        pending = result.current
          .mutateAsync({ action: "unfollow", previousStatus: "seguindo", userId: "user-1" })
          .catch(() => undefined);
      });
      await waitFor(() => expect(mockUnfollow).toHaveBeenCalled());
      // E.g. a pull to refresh answered meanwhile: the server already applied the unfollow,
      // only its response got lost.
      const fresh = profile({ can_view_content: false, counts: null, is_private: true });
      act(() => client.setQueryData(TARGET_PROFILE, fresh));
      await act(async () => {
        request.reject(new Error("network"));
        await pending;
      });

      expect(client.getQueryData(TARGET_PROFILE)).toEqual(fresh);
    });
  });
});
