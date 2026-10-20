import type { LinkingOptions } from "@react-navigation/native";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { env } from "@/app/config";
import { ApiError } from "@/services/api";

import type { ProfileRead } from "../types";

/**
 * Perfis fictícios para validar a UserProfileScreen no Expo Go enquanto o endpoint de
 * terceiros (#109) não existe. Só desenvolvimento: NÃO representa integração com o
 * backend. Ver IMPLEMENTATION_NOTES.md, §10.
 */

export const MOCK_PROFILE_ID_PREFIX = "mock-profile-";

const MUSE_STARLIGHT = {
  artist_name: "Muse",
  cover_url: "https://picsum.photos/seed/recorda-starlight/200",
  deezer_track_id: "mock-track-starlight",
  preview_url: null,
  title: "Starlight"
};

const COUNTS = { followers: 15, following: 256, recordas: 6 };
const STREAK = { current_days: 12, published_today: true };

function mockProfile(
  scenario: string,
  profile: Omit<ProfileRead, "favorite_song" | "user_id"> &
    Partial<Pick<ProfileRead, "favorite_song">>
): ProfileRead {
  return {
    favorite_song: MUSE_STARLIGHT,
    ...profile,
    user_id: `${MOCK_PROFILE_ID_PREFIX}${scenario}`
  };
}

// Sem acesso, `counts` e `streak` vêm null, como no texto do C-2. A visibilidade do streak
// em perfil privado é divergência pendente (§7.1); a tela não exibe streak de todo modo.
export const MOCK_PROFILES: readonly ProfileRead[] = [
  mockProfile("public", {
    can_view_content: true,
    counts: COUNTS,
    is_private: false,
    name: "Lucas Almeida",
    profile_picture_url: "https://i.pravatar.cc/300?img=12",
    relationship: { follow_id: null, follow_status: "nenhuma", is_self: false },
    streak: STREAK,
    username: "lucas_almeida"
  }),
  mockProfile("private", {
    can_view_content: false,
    counts: null,
    is_private: true,
    name: "Mariana Costa",
    profile_picture_url: "https://i.pravatar.cc/300?img=47",
    relationship: { follow_id: null, follow_status: "nenhuma", is_self: false },
    streak: null,
    username: "mariana.costa"
  }),
  mockProfile("requested", {
    can_view_content: false,
    counts: null,
    is_private: true,
    name: "Rafael Souza",
    profile_picture_url: "https://i.pravatar.cc/300?img=33",
    relationship: {
      follow_id: "mock-follow-requested",
      follow_status: "solicitado",
      is_self: false
    },
    streak: null,
    username: "rafael_souza"
  }),
  mockProfile("private-following", {
    can_view_content: true,
    counts: { followers: 87, following: 120, recordas: 23 },
    favorite_song: {
      artist_name: "Imagine Dragons",
      cover_url: "",
      deezer_track_id: "mock-track-believer",
      preview_url: null,
      title: "Believer"
    },
    is_private: true,
    name: "Beatriz Lima",
    profile_picture_url: null,
    relationship: {
      follow_id: "mock-follow-private-following",
      follow_status: "seguindo",
      is_self: false
    },
    streak: { current_days: 3, published_today: false },
    username: "bia.lima"
  }),
  mockProfile("public-following", {
    can_view_content: true,
    counts: { followers: 1, following: 1, recordas: 1 },
    is_private: false,
    name: "João Pereira",
    profile_picture_url: "https://i.pravatar.cc/300?img=68",
    relationship: {
      follow_id: "mock-follow-public-following",
      follow_status: "seguindo",
      is_self: false
    },
    streak: STREAK,
    username: "joao.pereira"
  })
];

/** Never on in production builds, whatever the environment says. */
export function isProfileMockEnabled(dev: boolean = __DEV__, flag: boolean = env.profileMock) {
  return dev && flag;
}

export function isMockProfileId(userId: string) {
  return userId.startsWith(MOCK_PROFILE_ID_PREFIX);
}

/** A fictitious profile, or a local 404 for an unknown mock id: mock ids never reach the API. */
export function getMockProfile(userId: string): Promise<ProfileRead> {
  const profile = MOCK_PROFILES.find((candidate) => candidate.user_id === userId);

  return profile
    ? Promise.resolve(profile)
    : Promise.reject(new ApiError("NOT_FOUND", "Mock profile not found.", 404, null));
}

/**
 * Follow and report services call this before any request: a fictitious id must never be
 * sent to the backend.
 */
export function rejectMockProfileAction(): Promise<never> {
  return Promise.reject(
    new ApiError("MOCK_PROFILE", "Actions are disabled for mock profiles.", 0, null)
  );
}

/**
 * Deep link to open a scenario in Expo Go: exp://<IP>:<porta>/--/mock-profile/<user_id>.
 * `exp://*` matches any host and port, so the link survives IP changes.
 */
export const PROFILE_MOCK_LINKING: LinkingOptions<RootStackParamList> = {
  config: { screens: { UserProfile: "--/mock-profile/:userId" } },
  prefixes: ["exp://*", "exps://*"]
};
