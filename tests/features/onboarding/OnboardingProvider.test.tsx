import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { OnboardingProvider, useOnboarding } from "@/features/onboarding/state/OnboardingContext";

function OnboardingFlowHarness() {
  const [step, setStep] = useState<1 | 2>(1);
  const { selectedArtistIds, selectedGenreIds, setSelectedArtistIds, setSelectedGenreIds } =
    useOnboarding();

  if (step === 1) {
    return (
      <View>
        <Pressable
          accessibilityLabel="Artista 10"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selectedArtistIds.includes(10) }}
          onPress={() => setSelectedArtistIds([10])}
        >
          <Text>Artista 10</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setStep(2)}>
          <Text>Ir para gêneros</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Pressable
        accessibilityLabel="Gênero 20"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selectedGenreIds.includes(20) }}
        onPress={() => setSelectedGenreIds([20])}
      >
        <Text>Gênero 20</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setStep(1)}>
        <Text>Voltar para artistas</Text>
      </Pressable>
    </View>
  );
}

describe("OnboardingProvider", () => {
  it("preserves artist and genre selections while moving between steps", () => {
    render(
      <OnboardingProvider>
        <OnboardingFlowHarness />
      </OnboardingProvider>
    );

    fireEvent.press(screen.getByRole("checkbox", { name: "Artista 10" }));
    fireEvent.press(screen.getByRole("button", { name: "Ir para gêneros" }));
    fireEvent.press(screen.getByRole("checkbox", { name: "Gênero 20" }));
    fireEvent.press(screen.getByRole("button", { name: "Voltar para artistas" }));

    expect(screen.getByRole("checkbox", { name: "Artista 10" })).toBeChecked();

    fireEvent.press(screen.getByRole("button", { name: "Ir para gêneros" }));
    expect(screen.getByRole("checkbox", { name: "Gênero 20" })).toBeChecked();
  });
});
