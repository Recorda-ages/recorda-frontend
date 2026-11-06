import { followService } from "@/features/follow/services/followService";
import { authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  authApiClient: { delete: jest.fn(), post: jest.fn() }
}));

const mockPost = authApiClient.post as jest.Mock;
const mockDelete = authApiClient.delete as jest.Mock;

beforeEach(() => {
  mockPost.mockReset();
  mockDelete.mockReset();
});

// Este service é o contrato com a BE#43: quando o endpoint existir, é por aqui
// que a tela fala com ele. Os testes travam método, path e resposta.
describe("followService", () => {
  it("follows a user through POST and returns the resulting status", async () => {
    mockPost.mockResolvedValueOnce({ follow_status: "seguindo" });

    await expect(followService.follow("user-1")).resolves.toEqual({ follow_status: "seguindo" });
    expect(mockPost).toHaveBeenCalledWith("/users/user-1/follow", undefined, {
      signal: undefined
    });
  });

  it("unfollows a user through DELETE and forwards the abort signal", async () => {
    mockDelete.mockResolvedValueOnce({ follow_status: "nenhuma" });
    const controller = new AbortController();

    await expect(followService.unfollow("user-1", controller.signal)).resolves.toEqual({
      follow_status: "nenhuma"
    });
    expect(mockDelete).toHaveBeenCalledWith("/users/user-1/follow", {
      signal: controller.signal
    });
  });

  it.each([
    ["follow", () => followService.follow("a/b?c"), () => mockPost],
    ["unfollow", () => followService.unfollow("a/b?c"), () => mockDelete]
  ])("percent-encodes the user id on %s", async (_label, call, getMock) => {
    getMock().mockResolvedValueOnce({ follow_status: "nenhuma" });

    await call();

    expect(getMock().mock.calls[0][0]).toBe("/users/a%2Fb%3Fc/follow");
  });
});
