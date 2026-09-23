import { authApiClient } from "@/services/api";
import { listFollowers, listFollowing, removeFollower } from "@/features/friends/api/friendsApi";

jest.mock("@/services/api", () => ({
  authApiClient: {
    get: jest.fn(),
    delete: jest.fn()
  }
}));

const mockGet = authApiClient.get as jest.Mock;
const mockDelete = authApiClient.delete as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listFollowers", () => {
  const rawUser = {
    user_id: "u1",
    username: "janedoe",
    name: "Jane Doe",
    profile_picture_url: "https://example.com/avatar.jpg"
  };

  it("calls the correct endpoint for a user", async () => {
    mockGet.mockResolvedValueOnce([rawUser]);

    await listFollowers("user-123");

    expect(mockGet).toHaveBeenCalledWith("/users/user-123/followers");
  });

  it("maps the raw API response to FriendProfile", async () => {
    mockGet.mockResolvedValueOnce([rawUser]);

    const result = await listFollowers("user-123");

    expect(result).toEqual([
      {
        id: "u1",
        username: "janedoe",
        displayName: "Jane Doe",
        avatarUrl: "https://example.com/avatar.jpg"
      }
    ]);
  });

  it("maps null profile_picture_url correctly", async () => {
    mockGet.mockResolvedValueOnce([{ ...rawUser, profile_picture_url: null }]);

    const result = await listFollowers("user-123");

    expect(result[0].avatarUrl).toBeNull();
  });

  it("appends the search query param when provided", async () => {
    mockGet.mockResolvedValueOnce([]);

    await listFollowers("user-123", { q: "jane" });

    expect(mockGet).toHaveBeenCalledWith("/users/user-123/followers?q=jane");
  });

  it("appends limit and offset params", async () => {
    mockGet.mockResolvedValueOnce([]);

    await listFollowers("user-123", { limit: 10, offset: 20 });

    expect(mockGet).toHaveBeenCalledWith("/users/user-123/followers?limit=10&offset=20");
  });

  it("omits undefined params from the query string", async () => {
    mockGet.mockResolvedValueOnce([]);

    await listFollowers("user-123", { q: undefined, limit: 5 });

    const calledUrl = mockGet.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("q=");
    expect(calledUrl).toContain("limit=5");
  });

  it("omits empty string params from the query string", async () => {
    mockGet.mockResolvedValueOnce([]);

    await listFollowers("user-123", { q: "" });

    expect(mockGet).toHaveBeenCalledWith("/users/user-123/followers");
  });

  it("returns an empty array when the API returns no items", async () => {
    mockGet.mockResolvedValueOnce([]);

    const result = await listFollowers("user-123");

    expect(result).toEqual([]);
  });
});

describe("listFollowing", () => {
  it("calls the correct following endpoint", async () => {
    mockGet.mockResolvedValueOnce([]);

    await listFollowing("user-456");

    expect(mockGet).toHaveBeenCalledWith("/users/user-456/following");
  });

  it("maps the raw API response to FriendProfile", async () => {
    mockGet.mockResolvedValueOnce([
      { user_id: "u2", username: "bob", name: "Bob Smith", profile_picture_url: null }
    ]);

    const result = await listFollowing("user-456");

    expect(result).toEqual([
      { id: "u2", username: "bob", displayName: "Bob Smith", avatarUrl: null }
    ]);
  });

  it("appends a search param when provided", async () => {
    mockGet.mockResolvedValueOnce([]);

    await listFollowing("user-456", { q: "bob" });

    expect(mockGet).toHaveBeenCalledWith("/users/user-456/following?q=bob");
  });
});

describe("removeFollower", () => {
  it("calls the correct DELETE endpoint", async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await removeFollower("follower-99");

    expect(mockDelete).toHaveBeenCalledWith("/users/me/followers/follower-99");
  });

  it("propagates API errors", async () => {
    mockDelete.mockRejectedValueOnce(new Error("Network error"));

    await expect(removeFollower("follower-99")).rejects.toThrow("Network error");
  });
});
