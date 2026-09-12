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
