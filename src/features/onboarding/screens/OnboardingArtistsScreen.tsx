import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppText, ErrorState, Loading } from "@/components/ui";
import { useArtistSearch } from "@/features/music/hooks/useArtistSearch";
import { usePopularArtists } from "@/features/music/hooks/usePopularArtists";
import { colors, fontFamily, spacing } from "@/theme";

import { ArtistChip, type ArtistOption } from "../components/ArtistChip";
import { OnboardingStepLayout } from "../components/OnboardingStepLayout";
import type { MusicSelection } from "../types";

const MIN_ARTISTS = 3;

export type OnboardingArtistsScreenProps = {
  selectedArtists: MusicSelection[];
  onSelectedArtistsChange: (artists: MusicSelection[]) => void;
  onBack: () => void;
  onContinue: () => void;
  headerTitle?: string;
  title?: string;
  subtitle?: string;
  continueLabel?: string;
};

export function OnboardingArtistsScreen({
  selectedArtists,
  onSelectedArtistsChange,
  onBack,
  onContinue,
  headerTitle,
  title,
  subtitle,
  continueLabel
}: OnboardingArtistsScreenProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useArtistSearch(debouncedQuery);
  const popular = usePopularArtists();
  const selectedArtistIds = useMemo(
    () => selectedArtists.map((artist) => artist.id),
    [selectedArtists]
  );
  const canAdvance = selectedArtists.length >= MIN_ARTISTS;
  const hasSearched = debouncedQuery.length > 0;
  const showPopularLoading = !hasSearched && popular.isPending;
  const showPopularError = !hasSearched && popular.isError;

  const artistOptions = useMemo<ArtistOption[]>(() => {
    const source = hasSearched ? search.data : popular.data;
    const results =
      source?.map((artist) => ({
        id: artist.id,
        name: artist.name,
        pictureUrl: artist.picture_url ?? undefined
      })) ?? [];

    return [
      ...selectedArtists,
      ...results.filter((artist) => !selectedArtistIds.includes(artist.id))
    ];
  }, [hasSearched, popular.data, search.data, selectedArtistIds, selectedArtists]);

  const toggleArtist = (artist: ArtistOption) => {
    const exists = selectedArtists.some((item) => item.id === artist.id);
    const updated = exists
      ? selectedArtists.filter((item) => item.id !== artist.id)
      : [...selectedArtists, { id: artist.id, name: artist.name, pictureUrl: artist.pictureUrl }];
    onSelectedArtistsChange(updated);
  };

  return (
    <OnboardingStepLayout
      activeStep={1}
      backAccessibilityLabel={t("onboarding.artists.back")}
      backButtonTestID="onboarding-artists-back-button"
      continueDisabled={!canAdvance}
      continueLabel={continueLabel ?? t("onboarding.artists.continue")}
      continueTestID="onboarding-artists-next-button"
      headerTitle={headerTitle ?? t("onboarding.artists.header")}
      keyboardShouldPersistTaps="handled"
      onBack={onBack}
      onContinue={onContinue}
      selectionCount={selectedArtists.length}
      stepLabel={t("onboarding.artists.step")}
      subtitle={subtitle ?? t("onboarding.artists.subtitle")}
      testID="onboarding-artists-screen"
      title={title ?? t("onboarding.artists.title")}
    >
      <View style={styles.search}>
        <TextInput
          accessibilityLabel={t("onboarding.artists.search")}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder={t("onboarding.artists.search")}
          placeholderTextColor={colors.neutrals[200]}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        {search.isFetching ? (
          <ActivityIndicator color={colors.primary[500]} size="small" />
        ) : query.length > 0 ? (
          <Pressable
            accessibilityLabel={t("onboarding.artists.clearSearch")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              setQuery("");
              setDebouncedQuery("");
            }}
          >
            <Icon color={colors.neutrals[200]} size={20} source="close-circle" />
          </Pressable>
        ) : (
          <Icon color={colors.neutrals[200]} size={24} source="magnify" />
        )}
      </View>

      {showPopularLoading ? <Loading label={t("onboarding.artists.popularLoading")} /> : null}

      {showPopularError ? <ErrorState message={t("onboarding.artists.popularError")} /> : null}

      {showPopularLoading || showPopularError ? null : (
        <View style={styles.grid}>
          {artistOptions.map((artist) => (
            <ArtistChip
              artist={artist}
              key={artist.id}
              onPress={() => toggleArtist(artist)}
              selected={selectedArtistIds.includes(artist.id)}
            />
          ))}
        </View>
      )}

      {search.isError ? (
        <AppText accessibilityRole="alert" style={styles.error}>
          {t("onboarding.artists.searchError")}
        </AppText>
      ) : null}

      {hasSearched && search.isSuccess && artistOptions.length === 0 ? (
        <AppText style={styles.empty}>{t("onboarding.artists.empty")}</AppText>
      ) : null}
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.neutrals[200],
    lineHeight: 21,
    paddingTop: spacing[4]
  },
  error: {
    color: colors.error[200],
    lineHeight: 21,
    paddingTop: spacing[4]
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[4]
  },
  input: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    minWidth: 0,
    paddingVertical: spacing[4]
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: 8,
    flexDirection: "row",
    marginTop: spacing[5],
    minHeight: 56,
    paddingHorizontal: spacing[6]
  }
});
