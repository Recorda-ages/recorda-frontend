import { useState } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";

import { saveMusicPreferences, searchTracks } from "../api/music";
import { OnboardingMusicScreen } from "./OnboardingMusicScreen";
import type { MusicTrack } from "../types";

export function OnboardingMusicRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { artists, genres } = useRoute<RouteProp<RootStackParamList, "OnboardingMusic">>().params;
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);

  return (
    <OnboardingMusicScreen
      selectedTrack={selectedTrack}
      selectedArtists={artists}
      selectedGenres={genres}
      onSelectTrack={setSelectedTrack}
      onBack={() => navigation.goBack()}
      onComplete={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })}
      searchTracks={searchTracks}
      savePreferences={saveMusicPreferences}
    />
  );
}
