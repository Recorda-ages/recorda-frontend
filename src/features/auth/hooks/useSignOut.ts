import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { useFeedAudioActions } from "@/features/feed/state/FeedAudioContext";
import { useOnboarding } from "@/features/onboarding/state/OnboardingContext";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";

import { clearSession } from "../session";

export function useSignOut() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reset: resetOnboarding } = useOnboarding();
  const { reset: resetRecordaDraft } = useRecordaDraft();
  const { setActivePreview, setActiveRoute } = useFeedAudioActions();

  return useCallback(async () => {
    setActiveRoute("Login");
    setActivePreview("", null);
    await clearSession();
    resetOnboarding();
    resetRecordaDraft();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }, [navigation, resetOnboarding, resetRecordaDraft, setActivePreview, setActiveRoute]);
}
