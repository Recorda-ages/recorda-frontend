import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";

import { useOnboarding } from "../state/OnboardingContext";
import { OnboardingGenresScreen } from "./OnboardingGenresScreen";

export function OnboardingGenresRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedGenres, setSelectedGenres } = useOnboarding();

  return (
    <OnboardingGenresScreen
      onBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }}
      onContinue={() => navigation.navigate("OnboardingMusic")}
      onSelectedGenresChange={setSelectedGenres}
      selectedGenres={selectedGenres}
    />
  );
}
