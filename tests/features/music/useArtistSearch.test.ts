import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useArtistSearch } from "@/features/music/hooks/useArtistSearch";
import { musicService } from "@/features/music/services/musicService";

jest.mock("@/features/music/services/musicService", () => ({
  musicService: { searchArtists: jest.fn() }
}));

const mockSearchArtists = musicService.searchArtists as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => mockSearchArtists.mockReset());

describe("useArtistSearch", () => {
  it("returns artists when query is non-empty", async () => {
    const artists = [{ id: 10, name: "Eminem", picture_url: null }];
    mockSearchArtists.mockResolvedValueOnce(artists);

    const { result } = renderHook(() => useArtistSearch("Eminem"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(artists);
  });

  it("uses the trimmed query when searching artists", async () => {
    mockSearchArtists.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useArtistSearch("  Eminem  "), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSearchArtists).toHaveBeenCalledWith("Eminem");
  });

  it("does not fetch when query is empty", () => {
    const { result } = renderHook(() => useArtistSearch(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSearchArtists).not.toHaveBeenCalled();
  });

  it("does not fetch when query is only whitespace", () => {
    const { result } = renderHook(() => useArtistSearch("   "), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSearchArtists).not.toHaveBeenCalled();
  });
});
