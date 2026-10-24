import { useMemo } from "react";
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

export type OnboardingGenresScreenProps = {
  onBack: () => void;
  onContinue: () => void;
  onSelectedGenresChange: (genres: MusicSelection[]) => void;
  selectedGenres: MusicSelection[];
  headerTitle?: string;
  title?: string;
  subtitle?: string;
  continueLabel?: string;
};

export function OnboardingGenresScreen(props: OnboardingGenresScreenProps) {
  const {
    onBack,
    onContinue,
    onSelectedGenresChange,
    selectedGenres,
    headerTitle,
    title,
    subtitle,
    continueLabel
  } = props;
  const { t } = useTranslation();
  const genresQuery = useGenres();
  const selectedGenreIds = selectedGenres.map((genre) => genre.id);
  const canContinue = selectedGenres.length >= 3;
  const visibleGenres = useMemo<Genre[]>(() => {
    const savedGenres = selectedGenres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      picture_url: genre.pictureUrl ?? null
    }));
    const availableGenres = genresQuery.data ?? [];

    return [
      ...savedGenres,
      ...availableGenres.filter((genre) => !selectedGenreIds.includes(genre.id))
    ];
  }, [genresQuery.data, selectedGenreIds, selectedGenres]);

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
      continueLabel={continueLabel ?? t("onboarding.genres.continue")}
      headerTitle={headerTitle ?? t("onboarding.genres.header")}
      onBack={onBack}
      onContinue={onContinue}
      selectionCount={selectedGenres.length}
      stepLabel={t("onboarding.genres.step")}
      subtitle={subtitle ?? t("onboarding.genres.subtitle")}
      testID="onboarding-genres-screen"
      title={title ?? t("onboarding.genres.title")}
    >
      {genresQuery.isPending ? <Loading label={t("onboarding.genres.loading")} /> : null}

      {genresQuery.isError ? <ErrorState message={t("onboarding.genres.loadError")} /> : null}

      {genresQuery.isSuccess || selectedGenres.length > 0 ? (
        <View style={styles.grid}>
          {visibleGenres.map((genre) => {
            const isSelected = selectedGenreIds.includes(genre.id);

            return (
              <Pressable
                accessibilityLabel={genre.name}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                key={genre.id}
                onPress={() => toggleGenre(genre)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                {genre.picture_url ? (
                  <Image source={{ uri: genre.picture_url }} style={styles.chipImage} />
                ) : null}
                <AppText style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {genre.name}
                </AppText>
                {isSelected ? <Icon color={colors.primary[500]} size={16} source="check" /> : null}
              </Pressable>
            );
          })}
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
  chipSelected: {
    backgroundColor: colors.primary[900],
    borderColor: colors.primary[500],
    borderWidth: 1
  },
  chipText: {
    color: colors.neutrals[200],
    fontSize: 14
  },
  chipTextSelected: {
    color: colors.neutrals[100]
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[4]
  }
});
