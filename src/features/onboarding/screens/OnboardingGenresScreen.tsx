import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText, ErrorState, Loading } from "@/components/ui";
import { useGenres } from "@/features/music/hooks/useGenres";
import type { Genre } from "@/features/music/services/musicService";
import { colors, spacing } from "@/theme";

import { OnboardingStepLayout } from "../components/OnboardingStepLayout";
import type { MusicSelection } from "../types";

type OnboardingGenresScreenProps = {
  onBack: () => void;
  onContinue: () => void;
  onSelectedGenresChange: (genres: MusicSelection[]) => void;
  selectedGenres: MusicSelection[];
};

export function OnboardingGenresScreen(props: OnboardingGenresScreenProps) {
  const { onBack, onContinue, onSelectedGenresChange, selectedGenres } = props;
  const { t } = useTranslation();
  const genresQuery = useGenres();
  const selectedGenreIds = selectedGenres.map((genre) => genre.id);
  const canContinue = selectedGenres.length >= 3;

  const toggleGenre = (genre: Genre) => {
    const nextGenres = selectedGenreIds.includes(genre.id)
      ? selectedGenres.filter((selectedGenre) => selectedGenre.id !== genre.id)
      : [
          ...selectedGenres,
          { id: genre.id, name: genre.name, pictureUrl: genre.picture_url ?? undefined }
        ];

    onSelectedGenresChange(nextGenres);
  };

  return (
    <OnboardingStepLayout
      activeStep={2}
      backAccessibilityLabel={t("onboarding.genres.back")}
      continueDisabled={!canContinue}
      continueLabel={t("onboarding.genres.continue")}
      headerTitle={t("onboarding.genres.header")}
      onBack={onBack}
      onContinue={onContinue}
      selectionCount={selectedGenres.length}
      stepLabel={t("onboarding.genres.step")}
      subtitle={t("onboarding.genres.subtitle")}
      testID="onboarding-genres-screen"
      title={t("onboarding.genres.title")}
    >
      {genresQuery.isPending ? <Loading label={t("onboarding.genres.loading")} /> : null}
      {genresQuery.isError ? <ErrorState message={t("onboarding.genres.loadError")} /> : null}
      {genresQuery.data ? (
        <View style={styles.grid}>
          {genresQuery.data.map((genre) => (
            <Pressable
              accessibilityLabel={genre.name}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedGenreIds.includes(genre.id) }}
              key={genre.id}
              onPress={() => toggleGenre(genre)}
              style={[
                styles.chip,
                selectedGenreIds.includes(genre.id) ? styles.chipSelected : undefined
              ]}
            >
              {genre.picture_url ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  source={genre.picture_url}
                  style={styles.chipImage}
                  transition={150}
                />
              ) : (
                <View style={styles.chipImageFallback}>
                  <Icon color={colors.neutrals[100]} size={18} source="music-note" />
                </View>
              )}
              <AppText style={styles.chipLabel} variant="buttonSmall">
                {genre.name}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.secondary[900],
    borderRadius: 20,
    flexDirection: "row",
    gap: 10,
    height: 40,
    paddingLeft: 4,
    paddingRight: 14
  },
  chipImage: {
    borderRadius: 16,
    height: 32,
    width: 32
  },
  chipImageFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[700],
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  chipLabel: {
    color: colors.secondary[100],
    letterSpacing: 0.46,
    lineHeight: 26
  },
  chipSelected: {
    backgroundColor: colors.primary[900],
    borderColor: colors.primary[500],
    borderWidth: 1.5
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[4]
  }
});
