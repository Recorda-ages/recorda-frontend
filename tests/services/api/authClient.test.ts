import { onInvalidSession, resetPrivateState } from "@/services/api/sessionLifecycle";
import { authApiClient, AUTH_TOKEN_KEY } from "@/services/api";
import { secureStorage } from "@/services/storage";

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn()
  }
}));

const getItem = secureStorage.getItem as jest.Mock;

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(jsonResponse({}));
  getItem.mockReset();
});

it("reads the token from the shared AUTH_TOKEN_KEY", async () => {
  getItem.mockResolvedValue("token-abc");

  await authApiClient.get("/auth/me");

  expect(getItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
  expect(AUTH_TOKEN_KEY).toBe("auth_token");
});

it("attaches the bearer token automatically when one is stored", async () => {
  getItem.mockResolvedValue("token-abc");

  await authApiClient.post("/users/me/music-preferences", { hello: "world" });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(init.headers.Authorization).toBe("Bearer token-abc");
  expect(JSON.parse(init.body)).toEqual({ hello: "world" });
});

it("merges caller-supplied headers with the Authorization header", async () => {
  getItem.mockResolvedValue("token-abc");

  await authApiClient.get("/auth/me", { headers: { "X-Trace": "42" } });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(init.headers.Authorization).toBe("Bearer token-abc");
  expect(init.headers["X-Trace"]).toBe("42");
});

it("sends no Authorization header when no token is stored", async () => {
  getItem.mockResolvedValue(null);

  await authApiClient.get("/auth/me");

  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(init.headers.Authorization).toBeUndefined();
});

it("authenticates every verb", async () => {
  getItem.mockResolvedValue("token-abc");

  await authApiClient.get("/x");
  await authApiClient.post("/x", {});
  await authApiClient.put("/x", {});
  await authApiClient.patch("/x", {});
  await authApiClient.delete("/x");

  const methods = fetchMock.mock.calls.map(([, init]) => init.method);
  expect(methods).toEqual(["GET", "POST", "PUT", "PATCH", "DELETE"]);
  for (const [, init] of fetchMock.mock.calls) {
    expect(init.headers.Authorization).toBe("Bearer token-abc");
  }
});

it("aborts pending requests and rejects late responses after a session change", async () => {
  getItem.mockResolvedValue("old-token");
  let finish!: (value: ReturnType<typeof jsonResponse>) => void;
  fetchMock.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const request = authApiClient.get("/private");
  const rejection = expect(request).rejects.toMatchObject({ name: "AbortError" });
  await Promise.resolve();
  await Promise.resolve();
  const signal = fetchMock.mock.calls[0][1].signal;
  resetPrivateState();
  expect(signal.aborted).toBe(true);
  finish(jsonResponse({ secret: "old-account" }));
  await rejection;
});

it("does not send a token read that finishes after logout", async () => {
  let finish!: (value: string) => void;
  getItem.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const request = authApiClient.post("/private", {});
  const rejection = expect(request).rejects.toMatchObject({ name: "AbortError" });
  resetPrivateState();
  finish("old-token");
  await rejection;
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([401, 403, 422, 500])(
  "only expires the session for HTTP 401, received %s",
  async (status) => {
    const expired = jest.fn();
    const unsubscribe = onInvalidSession(expired);
    getItem.mockResolvedValue("token");
    fetchMock.mockResolvedValue({ ...jsonResponse({}), ok: false, status });
    try {
      await expect(authApiClient.get("/private")).rejects.toMatchObject({ status });
      expect(expired).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
    } finally {
      unsubscribe();
    }
  }
);

it("does not expire a renewed account token for an old token's 401", async () => {
  const expired = jest.fn();
  const unsubscribe = onInvalidSession(expired);
  getItem.mockResolvedValueOnce("old-token").mockResolvedValueOnce("renewed-token");
  fetchMock.mockResolvedValue({ ...jsonResponse({}), ok: false, status: 401 });
  try {
    await expect(authApiClient.get("/private")).rejects.toMatchObject({ status: 401 });
    expect(expired).not.toHaveBeenCalled();
  } finally {
    unsubscribe();
  }
});
