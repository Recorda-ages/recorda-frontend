import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { useToast } from "@/components/ui";
import { clearSession } from "@/features/auth/session";
import { useOnboarding } from "@/features/onboarding/state/OnboardingContext";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";

export function useLeaveToLogin() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { reset: resetOnboarding } = useOnboarding();
  const { reset: resetRecordaDraft } = useRecordaDraft();
  const { showToast } = useToast();

  return useCallback(
    async (message: string) => {
      await clearSession();
      resetOnboarding();
      resetRecordaDraft();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      showToast(message);
    },
    [navigation, resetOnboarding, resetRecordaDraft, showToast]
  );
}
