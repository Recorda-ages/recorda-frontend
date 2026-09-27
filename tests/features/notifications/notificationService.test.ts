import { notificationService } from "@/features/notifications/services/notificationService";
import { authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  authApiClient: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn()
  }
}));

const mockGet = authApiClient.get as jest.Mock;
const mockPatch = authApiClient.patch as jest.Mock;
const mockPost = authApiClient.post as jest.Mock;

beforeEach(() => {
  mockGet.mockReset();
  mockPatch.mockReset();
  mockPost.mockReset();
});

describe("notificationService", () => {
  it("lists a notification page with pagination and abort support", async () => {
    const controller = new AbortController();
    mockGet.mockResolvedValueOnce({ items: [], unread_count: 0 });

    await notificationService.list(20, 40, controller.signal);

    expect(mockGet).toHaveBeenCalledWith("/notifications?limit=20&offset=40", {
      signal: controller.signal
    });
  });

  it("marks every notification as read", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    await notificationService.markAllAsRead();

    expect(mockPost).toHaveBeenCalledWith("/notifications/read-all");
  });

  it("responds to a follow request", async () => {
    mockPatch.mockResolvedValueOnce(undefined);

    await notificationService.respondToFollowRequest("follow-1", "accept");

    expect(mockPatch).toHaveBeenCalledWith("/follow-requests/follow-1", { action: "accept" });
  });
});
