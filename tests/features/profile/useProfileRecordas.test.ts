import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useProfileRecordas } from "@/features/profile/hooks/useProfileRecordas";
import { profileQueryKey } from "@/features/profile/queryKeys";
import { profileService } from "@/features/profile/services/profileService";
import type { RecordaGridItem, RecordaGridPage } from "@/features/profile/types";
import { ApiError } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: { getMyProfile: jest.fn(), getUserRecordas: jest.fn() }
}));

const mockGetUserRecordas = profileService.getUserRecordas as jest.Mock;

function item(id: string, createdAt: string): RecordaGridItem {
  return {
    created_at: createdAt,
    media_type: "PHOTO",
    media_url: `/media/${id}.jpg`,
    recorda_id: id,
    song_artist_name: "Muse",
    song_cover_url: "",
    song_title: "Starlight"
  };
}

const FIRST_PAGE: RecordaGridPage = {
  items: [item("r3", "2026-10-22T12:00:00Z"), item("r2", "2026-10-21T12:00:00Z")],
  next_cursor: "cursor-2"
};
const LAST_PAGE: RecordaGridPage = {
  items: [item("r1", "2026-10-20T12:00:00Z")],
  next_cursor: null
};

const clients: QueryClient[] = [];

function renderUseProfileRecordas(userId: string | undefined, enabled?: boolean) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retryDelay: 0 } }
  });
  clients.push(client);

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }

  return { client, ...renderHook(() => useProfileRecordas(userId, enabled), { wrapper }) };
}

beforeEach(() => {
  mockGetUserRecordas.mockReset();
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("useProfileRecordas", () => {
  it("loads the first page without a cursor, under the grid key", async () => {
    mockGetUserRecordas.mockResolvedValueOnce(FIRST_PAGE);
    const { client, result } = renderUseProfileRecordas("user-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetUserRecordas).toHaveBeenCalledWith("user-1", null, expect.any(AbortSignal));
    expect(client.getQueryData(["profile", "user-1", "recordas"])).toBeDefined();
    expect(result.current.hasNextPage).toBe(true);
  });

  it("follows next_cursor and stops when it is null, keeping the backend order", async () => {
    mockGetUserRecordas.mockResolvedValueOnce(FIRST_PAGE).mockResolvedValueOnce(LAST_PAGE);
    const { result } = renderUseProfileRecordas("user-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Read from the returned result, as in useFollowingFeed's test: `result.current` of
    // renderHook doesn't reliably reflect the appended page here.
    let next: Awaited<ReturnType<typeof result.current.fetchNextPage>> | undefined;
    await act(async () => {
      next = await result.current.fetchNextPage();
    });

    expect(mockGetUserRecordas).toHaveBeenLastCalledWith(
      "user-1",
      "cursor-2",
      expect.any(AbortSignal)
    );
    expect(next?.hasNextPage).toBe(false);
    expect(
      next?.data?.pages.flatMap((page) => page.items.map((entry) => entry.recorda_id))
    ).toEqual(["r3", "r2", "r1"]);
  });

  it.each([
    ["without a user id", undefined, undefined],
    ["when disabled", "user-1", false]
  ])("does not fetch %s", (_case, userId, enabled) => {
    const { result } = renderUseProfileRecordas(userId, enabled);

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetUserRecordas).not.toHaveBeenCalled();
  });

  it("does not retry a private or missing account", async () => {
    mockGetUserRecordas.mockRejectedValue(new ApiError("FORBIDDEN", "Privada", 403, null));
    const { result } = renderUseProfileRecordas("user-2");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGetUserRecordas).toHaveBeenCalledTimes(1);
  });

  it("refetches when the profile key is invalidated", async () => {
    mockGetUserRecordas.mockResolvedValue(LAST_PAGE);
    const { client, result } = renderUseProfileRecordas("user-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await client.invalidateQueries({ queryKey: profileQueryKey("user-1") });
    });

    expect(mockGetUserRecordas).toHaveBeenCalledTimes(2);
  });
});
