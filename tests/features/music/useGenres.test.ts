import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useGenres } from "@/features/music/hooks/useGenres";
import { musicService } from "@/features/music/services/musicService";

jest.mock("@/features/music/services/musicService", () => ({
  musicService: { getGenres: jest.fn() },
}));

const mockGetGenres = musicService.getGenres as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => mockGetGenres.mockReset());

describe("useGenres", () => {
  it("returns genres on success", async () => {
    const genres = [{ id: 1, name: "Pop", picture_url: null }];
    mockGetGenres.mockResolvedValueOnce(genres);

    const { result } = renderHook(() => useGenres(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(genres);
  });

  it("returns error state on failure", async () => {
    mockGetGenres.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useGenres(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
