import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { AppText, Button, Screen } from "@/components/ui";
import { OnboardingMusicScreen } from "./OnboardingMusicScreen";
import type { MusicTrack } from "../types";

const demoTracks: MusicTrack[] = [
  { id: 1, title: "Tempo Perdido", artist: "Legião Urbana" },
  { id: 2, title: "Evidências", artist: "Chitãozinho & Xororó" },
  { id: 3, title: "Velha Infância", artist: "Tribalistas" },
  { id: 4, title: "O Sol", artist: "Vitor Kley" },
  { id: 5, title: "Aquarela", artist: "Toquinho" }
];
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
async function searchDemoTracks(query: string) {
  return demoTracks.filter((track) =>
    normalize(`${track.title} ${track.artist}`).includes(normalize(query))
  );
}
async function saveDemoPreferences() {
  // Deliberately local: this route is only registered in development.
}

export function OnboardingMusicPreview() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [completed, setCompleted] = useState(false);
  if (completed)
    return (
      <Screen>
        <AppText>{t("onboarding.music.demo")}</AppText>
        <Button label={t("onboarding.music.close")} onPress={() => navigation.goBack()} />
      </Screen>
    );
  return (
    <OnboardingMusicScreen
      selectedTrack={selectedTrack}
      selectedArtists={[]}
      selectedGenres={[]}
      onSelectTrack={setSelectedTrack}
      onBack={() => navigation.goBack()}
      onComplete={() => setCompleted(true)}
      searchTracks={searchDemoTracks}
      savePreferences={saveDemoPreferences}
    />
  );
}
