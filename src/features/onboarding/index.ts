export { OnboardingMusicScreen } from "./screens/OnboardingMusicScreen";
export { OnboardingMusicRoute } from "./screens/OnboardingMusicRoute";
export { OnboardingGenresRoute } from "./screens/OnboardingGenresRoute";
export type { OnboardingMusicScreenProps } from "./screens/OnboardingMusicScreen";
export { getPopularTracks, saveMusicPreferences, searchTracks } from "./api/music";
export type { MusicPreferences, MusicSelection, MusicTrack } from "./types";

export { OnboardingGenresStep } from "./components/OnboardingGenresStep";
export { OnboardingProvider, useOnboarding } from "./state/OnboardingContext";
