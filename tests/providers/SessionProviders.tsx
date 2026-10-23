import type { PropsWithChildren } from "react";

import { FeedAudioProvider } from "@/features/feed/state/FeedAudioContext";
import { OnboardingProvider } from "@/features/onboarding/state/OnboardingContext";
import { RecordaDraftProvider } from "@/features/recorda-creation/context/RecordaDraftContext";

export function SessionProviders({ children }: PropsWithChildren) {
  return (
    <RecordaDraftProvider>
      <OnboardingProvider>
        <FeedAudioProvider>{children}</FeedAudioProvider>
      </OnboardingProvider>
    </RecordaDraftProvider>
  );
}
