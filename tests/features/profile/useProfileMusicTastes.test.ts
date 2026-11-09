import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import { useProfileMusicTastes } from "@/features/profile/hooks/useProfileMusicTastes";
import { profileService } from "@/features/profile/services/profileService";
import { ApiError } from "@/services/api";

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: { getUserMusicTastes: jest.fn() }
}));

const mockGetTastes = profileService.getUserMusicTastes as jest.Mock;
const clients: QueryClient[] = [];

function renderTastes(userId: string | undefined, enabled = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retryDelay: 0 } }
  });
  clients.push(client);

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }

  return { client, ...renderHook(() => useProfileMusicTastes(userId, enabled), { wrapper }) };
}

beforeEach(() => mockGetTastes.mockReset());

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe("useProfileMusicTastes", () => {
  it("maps the backend items to header chips, under the profile's key", async () => {
    mockGetTastes.mockResolvedValueOnce({
      artists: [
        { deezer_id: 27, name: "Daft Punk", picture_url: "https://cdn.example.com/dp.jpg" }
      ],
      genres: [{ deezer_id: 132, name: "Pop", picture_url: null }]
    });
    const { client, result } = renderTastes("user-2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetTastes).toHaveBeenCalledWith("user-2", expect.any(AbortSignal));
    expect(result.current.data).toEqual({
      artists: [{ id: 27, name: "Daft Punk", pictureUrl: "https://cdn.example.com/dp.jpg" }],
      genres: [{ id: 132, name: "Pop", pictureUrl: null }]
    });
    expect(client.getQueryData(["profile", "user-2", "music-tastes"])).toBeDefined();
  });

  it("does not request anything while disabled or without an id", () => {
    expect(renderTastes("user-2", false).result.current.fetchStatus).toBe("idle");
    expect(renderTastes(undefined).result.current.fetchStatus).toBe("idle");
    expect(mockGetTastes).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404])("does not retry a %i", async (status) => {
    mockGetTastes.mockRejectedValue(new ApiError("ERR", "No", status, null));
    const { result } = renderTastes("user-2");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGetTastes).toHaveBeenCalledTimes(1);
  });

  it("retries a server error once", async () => {
    mockGetTastes.mockRejectedValue(new ApiError("SERVER", "Boom", 500, null));
    const { result } = renderTastes("user-2");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockGetTastes).toHaveBeenCalledTimes(2);
  });
});
