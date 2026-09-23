import { notifyManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useFollowMutation } from "@/features/follow/hooks/useFollowMutation";
import { followService } from "@/features/follow/services/followService";
import type { FollowStatus } from "@/features/follow/types";

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

function setup(status: FollowStatus) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { gcTime: Infinity, retry: false }
    }
  });
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
});
