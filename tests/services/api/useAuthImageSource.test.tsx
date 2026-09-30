import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { AUTH_TOKEN_QUERY_KEY, isApiUrl, useAuthImageSource } from "@/services/api";

// The test environment's API base is the default http://localhost:8000.
const AUTH = { Authorization: "Bearer token-123" };

function renderSource(uri: string | null, token: string | null = "token-123") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, token);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return renderHook(() => useAuthImageSource(uri), { wrapper }).result.current;
}

describe("isApiUrl", () => {
  it.each([
    ["/api/v1/recordas/media/a.jpg", true],
    ["api/v1/users/avatar.png", true],
    ["http://localhost:8000/api/v1/recordas/media/a.mp4", true],
    ["https://i.pravatar.cc/150?img=47", false],
    ["https://cdn-images.dzcdn.net/cover.jpg", false],
    // Same prefix, different port: must not count as our API.
    ["http://localhost:80001/api/v1/recordas/media/a.jpg", false],
    ["file:///cache/clip.mp4", false]
  ])("%s -> %s", (url, expected) => {
    expect(isApiUrl(url)).toBe(expected);
  });
});

describe("useAuthImageSource", () => {
  it("sends the token to API media", () => {
    expect(renderSource("http://localhost:8000/api/v1/recordas/media/a.jpg")).toEqual({
      headers: AUTH,
      uri: "http://localhost:8000/api/v1/recordas/media/a.jpg"
    });
  });

  it("never sends the token to another host", () => {
    expect(renderSource("https://i.pravatar.cc/150?img=47")).toEqual({
      uri: "https://i.pravatar.cc/150?img=47"
    });
  });

  it("returns a plain source while there's no token", () => {
    expect(renderSource("http://localhost:8000/api/v1/recordas/media/a.jpg", null)).toEqual({
      uri: "http://localhost:8000/api/v1/recordas/media/a.jpg"
    });
  });

  it("returns nothing without a URI", () => {
    expect(renderSource(null)).toBeUndefined();
  });
});
