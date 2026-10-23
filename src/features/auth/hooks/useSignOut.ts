import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { useFeedAudioActions } from "@/features/feed/state/FeedAudioContext";
import { useOnboarding } from "@/features/onboarding/state/OnboardingContext";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";

import { clearSession } from "../session";

export function useSignOut() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onboarding = useOnboarding();
  const recordaDraft = useRecordaDraft();
  const audio = useFeedAudioActions();

  return async () => {
    audio.setActiveRoute("Login");
    audio.setActivePreview("", null);
    await clearSession();
    onboarding.reset();
    recordaDraft.reset();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };
}
