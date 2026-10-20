import { env } from "@/app/config";
import { MOCK_PROFILES } from "@/features/profile/mocks/profileMocks";
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

  describe("development mock", () => {
    const globals = globalThis as unknown as { __DEV__: boolean };
    const realDev = globals.__DEV__;
    const realFlag = env.profileMock;
    const mockProfile = MOCK_PROFILES[0];

    afterEach(() => {
      globals.__DEV__ = realDev;
      env.profileMock = realFlag;
    });

    it("answers mock ids locally, without HTTP, when enabled in development", async () => {
      globals.__DEV__ = true;
      env.profileMock = true;

      await expect(profileService.getUserProfile(mockProfile.user_id)).resolves.toBe(mockProfile);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("keeps using HTTP for real ids while enabled", async () => {
      globals.__DEV__ = true;
      env.profileMock = true;
      mockGet.mockResolvedValueOnce(PROFILE);

      await expect(profileService.getUserProfile("user-2")).resolves.toEqual(PROFILE);
      expect(mockGet).toHaveBeenCalledWith("/users/user-2/profile", { signal: undefined });
    });

    it("never falls back to a mock when the HTTP request fails", async () => {
      globals.__DEV__ = true;
      env.profileMock = true;
      const error = new ApiError("NOT_FOUND", "Not Found", 404, null);
      mockGet.mockRejectedValueOnce(error);

      await expect(profileService.getUserProfile("user-2")).rejects.toBe(error);
    });

    it("rejects an unknown mock id locally instead of sending it", async () => {
      globals.__DEV__ = true;
      env.profileMock = true;

      await expect(profileService.getUserProfile("mock-profile-missing")).rejects.toMatchObject({
        status: 404
      });
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("uses HTTP when the mock is disabled", async () => {
      globals.__DEV__ = true;
      env.profileMock = false;
      mockGet.mockResolvedValueOnce(PROFILE);

      await profileService.getUserProfile(mockProfile.user_id);

      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("never serves mock data in production, even with the flag on", async () => {
      globals.__DEV__ = false;
      env.profileMock = true;
      mockGet.mockResolvedValueOnce(PROFILE);

      await expect(profileService.getUserProfile(mockProfile.user_id)).resolves.toEqual(PROFILE);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});
