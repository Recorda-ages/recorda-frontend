import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { clearSession } from "@/features/auth/session";

import { useOnboarding } from "../state/OnboardingContext";
import { OnboardingArtistsScreen } from "./OnboardingArtistsScreen";

export function OnboardingArtistsRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedArtists, setSelectedArtists } = useOnboarding();

  const goBack = async () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <OnboardingArtistsScreen
      onBack={() => void goBack()}
      onContinue={() => navigation.navigate("OnboardingGenres")}
      onSelectedArtistsChange={setSelectedArtists}
      selectedArtists={selectedArtists}
    />
  );
}
