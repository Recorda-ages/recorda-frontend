export { OnboardingMusicScreen } from "./screens/OnboardingMusicScreen";
export { OnboardingMusicRoute } from "./screens/OnboardingMusicRoute";
export type { OnboardingMusicScreenProps } from "./screens/OnboardingMusicScreen";
export { saveMusicPreferences, searchTracks } from "./api/music";
export type { MusicPreferences, MusicSelection, MusicTrack } from "./types";

export { getGenres } from "./api/getGenres";
export { OnboardingGenresStep } from "./components/OnboardingGenresStep";
export { OnboardingProvider, useOnboarding } from "./state/OnboardingContext";
export type { Genre } from "./types";
