import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { usePopularArtists } from "@/features/music/hooks/usePopularArtists";
import { musicService } from "@/features/music/services/musicService";

jest.mock("@/features/music/services/musicService", () => ({
  musicService: { getPopularArtists: jest.fn() }
}));

const mockGetPopularArtists = musicService.getPopularArtists as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => mockGetPopularArtists.mockReset());

describe("usePopularArtists", () => {
  it("returns popular artists on success", async () => {
    const artists = [{ id: 10, name: "Eminem", picture_url: null }];
    mockGetPopularArtists.mockResolvedValueOnce(artists);

    const { result } = renderHook(() => usePopularArtists(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(artists);
  });

  it("returns error state on failure", async () => {
    mockGetPopularArtists.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => usePopularArtists(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
