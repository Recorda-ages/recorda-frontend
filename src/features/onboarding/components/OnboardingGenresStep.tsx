import { OnboardingGenresScreen } from "../screens/OnboardingGenresScreen";
import { useOnboarding } from "../state/OnboardingContext";

type OnboardingGenresStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function OnboardingGenresStep({ onBack, onContinue }: OnboardingGenresStepProps) {
  const { selectedGenreIds, setSelectedGenreIds } = useOnboarding();

  return (
    <OnboardingGenresScreen
      onBack={onBack}
      onContinue={onContinue}
      onSelectedGenreIdsChange={setSelectedGenreIds}
      selectedGenreIds={selectedGenreIds}
    />
  );
}
