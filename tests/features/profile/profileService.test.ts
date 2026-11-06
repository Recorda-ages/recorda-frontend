import { profileService } from "@/features/profile/services/profileService";
import type { ProfileRead } from "@/features/profile/types";
import { ApiError, authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  ...jest.requireActual("@/services/api"),
  authApiClient: { get: jest.fn() }
}));

const mockGet = authApiClient.get as jest.Mock;

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
  name: "Lucas Almeida",
  profile_picture_url: null,
  relationship: { follow_id: null, follow_status: "nenhuma", is_self: false },
  streak: null,
  user_id: "user-2",
  username: "lucas_almeida"
};

beforeEach(() => {
  mockGet.mockReset();
});

// O path é provisório até a #109 (IMPLEMENTATION_NOTES.md, §6.1); este teste o trava para
// que a troca, quando vier, seja explícita.
describe("profileService", () => {
  it("fetches the profile of a user and returns it unchanged", async () => {
    mockGet.mockResolvedValueOnce(PROFILE);
    const controller = new AbortController();

    await expect(profileService.getUserProfile("user-2", controller.signal)).resolves.toEqual(
      PROFILE
    );
    expect(mockGet).toHaveBeenCalledWith("/users/user-2/profile", { signal: controller.signal });
  });

  it("encodes the user id in the path", async () => {
    mockGet.mockResolvedValueOnce(PROFILE);

    await profileService.getUserProfile("a/b c");

    expect(mockGet).toHaveBeenCalledWith("/users/a%2Fb%20c/profile", { signal: undefined });
  });

  it("propagates API errors", async () => {
    const error = new ApiError("NOT_FOUND", "Usuário não encontrado.", 404, null);
    mockGet.mockRejectedValueOnce(error);

    await expect(profileService.getUserProfile("user-2")).rejects.toBe(error);
  });
});
