import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useTrackSearch } from "@/features/music/hooks/useTrackSearch";
import { musicService } from "@/features/music/services/musicService";

jest.mock("@/features/music/services/musicService", () => ({
  musicService: { searchTracks: jest.fn() }
}));

const mockSearchTracks = musicService.searchTracks as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return React.createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => mockSearchTracks.mockReset());

describe("useTrackSearch", () => {
  it("returns tracks when query is non-empty", async () => {
    const tracks = [
      {
        id: 100,
        title: "Lose Yourself",
        artist: "Eminem",
        album: "8 Mile",
        cover_url: null,
        preview_url: null,
        genre_id: 1
      }
    ];
    mockSearchTracks.mockResolvedValueOnce(tracks);

    const { result } = renderHook(() => useTrackSearch("Lose Yourself"), {
      wrapper
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(tracks);
  });

  it("does not fetch when query is empty", () => {
    const { result } = renderHook(() => useTrackSearch(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSearchTracks).not.toHaveBeenCalled();
  });

  it("does not fetch when query is only whitespace", () => {
    const { result } = renderHook(() => useTrackSearch("   "), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSearchTracks).not.toHaveBeenCalled();
  });
});
