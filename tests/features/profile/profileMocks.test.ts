import { getStateFromPath } from "@react-navigation/native";

import {
  getMockProfile,
  isMockProfileId,
  isProfileMockEnabled,
  MOCK_PROFILES,
  PROFILE_MOCK_LINKING
} from "@/features/profile/mocks/profileMocks";
import { ApiError } from "@/services/api";

const CONTRACT_KEYS = [
  "can_view_content",
  "counts",
  "favorite_song",
  "is_private",
  "name",
  "profile_picture_url",
  "relationship",
  "streak",
  "user_id",
  "username"
];

function scenario(userId: string) {
  const profile = MOCK_PROFILES.find((candidate) => candidate.user_id === userId);
  if (!profile) throw new Error(`Missing scenario ${userId}`);
  return profile;
}

describe("development mock profiles", () => {
  it("has five scenarios with distinct, stable mock ids", () => {
    expect(MOCK_PROFILES.map((profile) => profile.user_id)).toEqual([
      "mock-profile-public",
      "mock-profile-private",
      "mock-profile-requested",
      "mock-profile-private-following",
      "mock-profile-public-following"
    ]);
  });

  it("only uses ProfileRead fields", () => {
    for (const profile of MOCK_PROFILES) {
      expect(Object.keys(profile).sort()).toEqual(CONTRACT_KEYS);
      expect(Object.keys(profile.favorite_song).sort()).toEqual([
        "artist_name",
        "cover_url",
        "deezer_track_id",
        "preview_url",
        "title"
      ]);
      expect(Object.keys(profile.relationship).sort()).toEqual([
        "follow_id",
        "follow_status",
        "is_self"
      ]);
      expect(profile.relationship.is_self).toBe(false);
    }
  });

  it("hides counters exactly when there is no access to the content", () => {
    for (const profile of MOCK_PROFILES) {
      expect(profile.counts === null).toBe(!profile.can_view_content);
    }
  });

  it.each([
    ["mock-profile-public", false, "nenhuma", true],
    ["mock-profile-private", true, "nenhuma", false],
    ["mock-profile-requested", true, "solicitado", false],
    ["mock-profile-private-following", true, "seguindo", true],
    ["mock-profile-public-following", false, "seguindo", true]
  ] as const)(
    "%s is private=%s, %s, with access=%s",
    (userId, isPrivate, followStatus, canViewContent) => {
      const profile = scenario(userId);

      expect(profile.is_private).toBe(isPrivate);
      expect(profile.relationship.follow_status).toBe(followStatus);
      expect(profile.can_view_content).toBe(canViewContent);
    }
  );

  it("answers a known mock id and rejects an unknown one with a local 404", async () => {
    await expect(getMockProfile("mock-profile-public")).resolves.toBe(
      scenario("mock-profile-public")
    );

    const error = await getMockProfile("mock-profile-missing").catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
  });

  it("recognizes only ids with the mock prefix", () => {
    expect(isMockProfileId("mock-profile-public")).toBe(true);
    expect(isMockProfileId("22222222-2222-4222-8222-222222222222")).toBe(false);
  });
});

describe("isProfileMockEnabled", () => {
  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false]
  ])("dev=%s and flag=%s gives %s", (dev, flag, expected) => {
    expect(isProfileMockEnabled(dev, flag)).toBe(expected);
  });
});

describe("PROFILE_MOCK_LINKING", () => {
  it("routes a mock-profile path to UserProfile with its id", () => {
    const state = getStateFromPath(
      "/--/mock-profile/mock-profile-requested",
      PROFILE_MOCK_LINKING.config
    );

    expect(state?.routes[0]).toMatchObject({
      name: "UserProfile",
      params: { userId: "mock-profile-requested" }
    });
  });

  it("leaves a normal app launch alone", () => {
    expect(getStateFromPath("", PROFILE_MOCK_LINKING.config)).toBeUndefined();
  });
});
