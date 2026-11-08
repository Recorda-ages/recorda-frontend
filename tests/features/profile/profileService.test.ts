import { profileService } from "@/features/profile/services/profileService";
import type { ProfileRead, RecordaGridPage } from "@/features/profile/types";
import { ApiError, authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  authApiClient: { delete: jest.fn(), get: jest.fn(), put: jest.fn() }
}));

const mockGet = authApiClient.get as jest.Mock;
const mockPut = authApiClient.put as jest.Mock;
const mockDelete = authApiClient.delete as jest.Mock;

const PROFILE: ProfileRead = {
  can_view_content: true,
  counts: { followers: 15, following: 256, recordas: 6 },
  favorite_song: {
    artist_name: "Muse",
    cover_url: "https://cdn.example.com/starlight.jpg",
    deezer_track_id: "123",
    preview_url: null,
    title: "Starlight"
  },
  is_private: false,
  name: "Natalia",
  profile_picture_url: null,
  relationship: { follow_id: null, follow_status: "nenhuma", is_self: true },
  streak: { current_days: 3, published_today: true },
  user_id: "user-1",
  username: "natalia"
};

const PAGE: RecordaGridPage = {
  items: [
    {
      created_at: "2026-10-20T12:00:00Z",
      media_type: "PHOTO",
      media_url: "/media/a.jpg",
      recorda_id: "recorda-1",
      song_artist_name: "Muse",
      song_cover_url: "https://cdn.example.com/starlight.jpg",
      song_title: "Starlight"
    }
  ],
  next_cursor: "cursor-2"
};

beforeEach(() => {
  mockGet.mockReset();
});

describe("profileService.getMyProfile", () => {
  it("fetches the signed-in user's profile", async () => {
    mockGet.mockResolvedValueOnce(PROFILE);
    const controller = new AbortController();

    await expect(profileService.getMyProfile(controller.signal)).resolves.toEqual(PROFILE);
    expect(mockGet).toHaveBeenCalledWith("/users/me/profile", { signal: controller.signal });
  });

  it("propagates the 409 of an incomplete onboarding", async () => {
    const error = new ApiError("CONFLICT", "Complete o onboarding musical.", 409, null);
    mockGet.mockRejectedValueOnce(error);

    await expect(profileService.getMyProfile()).rejects.toBe(error);
  });
});

describe("profileService.getUserRecordas", () => {
  it("fetches the first page without a cursor or limit", async () => {
    mockGet.mockResolvedValueOnce(PAGE);
    const controller = new AbortController();

    await expect(
      profileService.getUserRecordas("user-1", null, controller.signal)
    ).resolves.toEqual(PAGE);
    expect(mockGet).toHaveBeenCalledWith("/users/user-1/recordas", {
      signal: controller.signal
    });
  });

  it("sends the cursor of the next page, encoded", async () => {
    mockGet.mockResolvedValueOnce(PAGE);

    await profileService.getUserRecordas("user-1", "2026-10-20T12:00:00Z|abc/=");

    expect(mockGet).toHaveBeenCalledWith(
      "/users/user-1/recordas?cursor=2026-10-20T12%3A00%3A00Z%7Cabc%2F%3D",
      { signal: undefined }
    );
  });

  it("encodes the user id in the path", async () => {
    mockGet.mockResolvedValueOnce(PAGE);

    await profileService.getUserRecordas("a/b c");

    expect(mockGet).toHaveBeenCalledWith("/users/a%2Fb%20c/recordas", { signal: undefined });
  });

  it("propagates API errors", async () => {
    const error = new ApiError("FORBIDDEN", "Esta conta é privada.", 403, null);
    mockGet.mockRejectedValueOnce(error);

    await expect(profileService.getUserRecordas("user-2")).rejects.toBe(error);
  });
});

describe("profileService avatar", () => {
  it("uploads the photo as multipart `file` to PUT /users/me/avatar", async () => {
    mockPut.mockResolvedValueOnce({ profile_picture_url: "/media/new.jpg" });

    await expect(profileService.uploadAvatar("file:///avatar.jpg")).resolves.toEqual({
      profile_picture_url: "/media/new.jpg"
    });
    const [path, body] = mockPut.mock.calls[0] as [string, FormData];
    expect(path).toBe("/users/me/avatar");
    expect(body.get("file")).toBeTruthy();
  });

  it("removes the photo with DELETE /users/me/avatar", async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    await profileService.deleteAvatar();

    expect(mockDelete).toHaveBeenCalledWith("/users/me/avatar");
  });
});
