import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { markOnboardingCompleted } from "@/features/auth/session";

import { getPopularTracks, saveMusicPreferences, searchTracks } from "../api/music";
import { useOnboarding } from "../state/OnboardingContext";
import type { MusicTrack } from "../types";
import { OnboardingMusicScreen } from "./OnboardingMusicScreen";

export function OnboardingMusicRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reset, selectedArtists, selectedGenres } = useOnboarding();
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);

  const completeOnboarding = () => {
    markOnboardingCompleted();
    reset();
    navigation.reset({ index: 0, routes: [{ name: "Feed" }] });
  };

  return (
    <OnboardingMusicScreen
      selectedTrack={selectedTrack}
      selectedArtists={selectedArtists}
      selectedGenres={selectedGenres}
      onSelectTrack={setSelectedTrack}
      onBack={() => navigation.goBack()}
      onComplete={completeOnboarding}
      searchTracks={searchTracks}
      getPopularTracks={getPopularTracks}
      savePreferences={saveMusicPreferences}
    />
  );
}
