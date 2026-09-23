import { userSearchService } from "@/features/user-search/services/userSearchService";
import { authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  authApiClient: { get: jest.fn() }
}));

const mockGet = authApiClient.get as jest.Mock;

beforeEach(() => mockGet.mockReset());

describe("userSearchService.searchUsers", () => {
  it("calls the authenticated search endpoint and forwards the abort signal", async () => {
    const results = [
      { avatar_url: null, follow_status: "nenhuma", user_id: "user-1", username: "jane_doe" }
    ];
    mockGet.mockResolvedValueOnce(results);
    const controller = new AbortController();

    await expect(userSearchService.searchUsers("jane", controller.signal)).resolves.toEqual(
      results
    );
    expect(mockGet).toHaveBeenCalledWith("/users/search?q=jane", { signal: controller.signal });
  });

  it("trims and percent-encodes the query", async () => {
    mockGet.mockResolvedValue([]);

    await userSearchService.searchUsers("  anne wilson  ");
    await userSearchService.searchUsers("joão&maria");

    expect(mockGet).toHaveBeenNthCalledWith(1, "/users/search?q=anne%20wilson", {
      signal: undefined
    });
    expect(mockGet).toHaveBeenNthCalledWith(2, "/users/search?q=jo%C3%A3o%26maria", {
      signal: undefined
    });
  });
});
