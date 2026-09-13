import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, ErrorState, Loading } from "@/components/ui";
import type { Genre } from "@/features/music/services/musicService";
import { useGenres } from "@/features/music/hooks/useGenres";
import { colors, fontFamily, spacing } from "@/theme";

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
  const { width } = useWindowDimensions();
  const backgroundScale = width / 393;
  const genresQuery = useGenres();
  const selectedGenreIds = selectedGenres.map((genre) => genre.id);

  const toggleGenre = (genre: Genre) => {
    const alreadySelected = selectedGenreIds.includes(genre.id);
    const nextGenres = alreadySelected
      ? selectedGenres.filter((selectedGenre) => selectedGenre.id !== genre.id)
      : [...selectedGenres, { id: genre.id, name: genre.name }];

    onSelectedGenresChange(nextGenres);
  };

  return (
    <SafeAreaView style={styles.screen} testID="onboarding-genres-screen">
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={require("../assets/gradient-glow.svg")}
          contentFit="contain"
          style={{
            position: "absolute",
            width: 894 * backgroundScale,
            height: 894 * backgroundScale,
            left: -446 * backgroundScale,
            top: -468 * backgroundScale
          }}
        />
        <Image
          source={require("../assets/gradient-glow.svg")}
          contentFit="contain"
          style={{
            position: "absolute",
            width: 894 * backgroundScale,
            height: 894 * backgroundScale,
            right: -535 * backgroundScale,
            bottom: -271 * backgroundScale
          }}
        />
      </View>

      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t("onboarding.genres.back")}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.backButton}
        >
          <Icon color={colors.neutrals[100]} size={32} source="chevron-left" />
        </Pressable>
        <AppText style={styles.topBarTitle} variant="headline4">
          {t("onboarding.genres.header")}
        </AppText>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <AppText color="primary" style={styles.step} variant="body2">
            {t("onboarding.genres.step")}
          </AppText>

          <View style={styles.description}>
            <AppText style={styles.title} variant="headline2">
              {t("onboarding.genres.title")}
            </AppText>
            <AppText color="muted" style={styles.subtitle}>
              {t("onboarding.genres.subtitle")}
            </AppText>
          </View>

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
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityLabel={t("onboarding.genres.continue")}
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedGenres.length < 3 }}
            disabled={selectedGenres.length < 3}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.continueButton,
              selectedGenres.length < 3
                ? styles.continueButtonDisabled
                : styles.continueButtonEnabled,
              pressed ? styles.continueButtonPressed : undefined
            ]}
          >
            <View style={styles.continueContent}>
              <AppText
                style={
                  selectedGenres.length < 3
                    ? styles.continueLabelDisabled
                    : styles.continueLabelEnabled
                }
                variant="buttonLarge"
              >
                {t("onboarding.genres.continue")}
              </AppText>
              <Icon
                color={selectedGenres.length < 3 ? colors.neutrals[400] : colors.primary[500]}
                size={24}
                source="chevron-right"
              />
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  content: {
    flex: 1,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4]
  },
  description: {
    gap: spacing[2]
  },
  backButton: {
    alignItems: "flex-start",
    justifyContent: "center",
    width: 48
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 226, 169, 0.05)",
    borderRadius: 100,
    borderWidth: 1.5,
    justifyContent: "center",
    minHeight: 58,
    width: "100%"
  },
  continueButtonDisabled: {
    borderColor: colors.neutrals[400]
  },
  continueButtonEnabled: {
    borderColor: colors.primary[500]
  },
  continueButtonPressed: {
    opacity: 0.82
  },
  continueContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2]
  },
  continueLabelDisabled: {
    color: colors.neutrals[400],
    lineHeight: 26
  },
  continueLabelEnabled: {
    color: colors.primary[500],
    lineHeight: 26
  },
  footer: {
    justifyContent: "flex-end",
    paddingTop: spacing[4]
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[4]
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing[4]
  },
  progressActive: {
    backgroundColor: colors.primary[500],
    borderRadius: 2,
    flex: 1,
    height: 4
  },
  progressInactive: {
    backgroundColor: colors.primary[800],
    borderRadius: 2,
    flex: 1,
    height: 4
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    overflow: "hidden",
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: spacing[4]
  },
  step: {
    letterSpacing: 0.15,
    lineHeight: 18,
    marginBottom: spacing[4]
  },
  subtitle: {
    letterSpacing: 0.15,
    lineHeight: 21
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: spacing[4]
  },
  topBarSpacer: {
    width: 48
  },
  topBarTitle: {
    color: colors.neutrals[100],
    fontWeight: "600"
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    lineHeight: 37
  }
});
