import { OnboardingGenresScreen } from "../screens/OnboardingGenresScreen";
import { useOnboarding } from "../state/OnboardingContext";

type OnboardingGenresStepProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function OnboardingGenresStep({ onBack, onContinue }: OnboardingGenresStepProps) {
  const { selectedGenres, setSelectedGenres } = useOnboarding();

  return (
    <OnboardingGenresScreen
      onBack={onBack}
      onContinue={onContinue}
      onSelectedGenresChange={setSelectedGenres}
      selectedGenres={selectedGenres}
    />
  );
}
