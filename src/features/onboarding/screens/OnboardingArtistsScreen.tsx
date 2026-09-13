import { useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { useArtistSearch } from "@/features/music/hooks/useArtistSearch";
import { colors, fontFamily, spacing } from "@/theme";

import { ArtistChip } from "../components/ArtistChip";
import { useOnboarding } from "../state/OnboardingContext";
import type { MusicSelection } from "../types";

const MIN_ARTISTS = 3;

export function OnboardingArtistsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedArtists, toggleArtist } = useOnboarding();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const backgroundScale = width / 393;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching, isError } = useArtistSearch(debouncedQuery);

  const results: MusicSelection[] = useMemo(
    () =>
      (data ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        imageUrl: a.picture_url ?? undefined
      })),
    [data]
  );

  const hasSearched = debouncedQuery.length > 0;
  const canAdvance = selectedArtists.length >= MIN_ARTISTS;

  const displayedArtists = useMemo(() => {
    const selectedIds = new Set(selectedArtists.map((a) => a.id));
    return [
      ...selectedArtists,
      ...results.filter((r) => !selectedIds.has(r.id))
    ];
  }, [selectedArtists, results]);

  return (
    <SafeAreaView style={styles.screen} testID="onboarding-artists-screen">
      <StatusBar style="light" />

      {/* ── Background Glow ─────────────────────────────────────── */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          contentFit="contain"
          source={require("../assets/gradient-glow.svg")}
          style={{
            position: "absolute",
            width: 894 * backgroundScale,
            height: 894 * backgroundScale,
            left: -446 * backgroundScale,
            top: -468 * backgroundScale
          }}
        />
        <Image
          contentFit="contain"
          source={require("../assets/gradient-glow.svg")}
          style={{
            position: "absolute",
            width: 894 * backgroundScale,
            height: 894 * backgroundScale,
            right: -535 * backgroundScale,
            bottom: -271 * backgroundScale
          }}
        />
      </View>

      {/* ── Top Bar ────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t("onboarding.artists.back")}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
          testID="onboarding-artists-back-button"
        >
          <Icon color={colors.neutrals[100]} size={32} source="chevron-left" />
        </Pressable>
        <AppText style={styles.topBarTitle} variant="headline4">
          {t("onboarding.artists.header")}
        </AppText>
        <View style={styles.topBarSpacer} />
      </View>

      {/* ── Main Content ────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Stepper: Etapa 1 de 3 */}
        <View style={styles.progress}>
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <AppText color="primary" style={styles.step} variant="body2">
            {t("onboarding.artists.step")}
          </AppText>

          <View style={styles.description}>
            <AppText style={styles.title} variant="headline2">
              {t("onboarding.artists.title")}
            </AppText>
            <AppText color="muted" style={styles.subtitle}>
              {t("onboarding.artists.subtitle")}
            </AppText>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Icon color={colors.neutrals[400]} size={20} source="magnify" />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder={t("onboarding.artists.searchPlaceholder")}
              placeholderTextColor={colors.neutrals[400]}
              returnKeyType="search"
              selectionColor={colors.primary[500]}
              style={styles.searchInput}
              value={query}
            />
            {isFetching ? (
              <ActivityIndicator color={colors.primary[500]} size="small" />
            ) : null}
          </View>

          {/* Chips grid */}
          <View style={styles.grid}>
            {displayedArtists.map((artist) => {
              const isSelected = selectedArtists.some((a) => a.id === artist.id);
              return (
                <ArtistChip
                  artist={artist}
                  key={artist.id}
                  onPress={() => toggleArtist(artist)}
                  selected={isSelected}
                />
              );
            })}
          </View>

          {isError ? (
            <AppText style={[styles.statusMessage, styles.errorMessage]} variant="body2">
              {t("onboarding.artists.loadError")}
            </AppText>
          ) : hasSearched && displayedArtists.length === 0 && !isFetching ? (
            <AppText color="muted" style={styles.statusMessage} variant="body2">
              {t("onboarding.artists.empty")}
            </AppText>
          ) : null}
        </ScrollView>

        {/* ── Footer ────────────────────────────────────────────── */}
        <View style={styles.footer}>
          {selectedArtists.length > 0 ? (
            <AppText color="muted" style={styles.selectionCount} variant="body2">
              {t("onboarding.artists.selectionCount", { count: selectedArtists.length })}
            </AppText>
          ) : null}

          <Pressable
            accessibilityLabel={t("onboarding.artists.continue")}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAdvance }}
            disabled={!canAdvance}
            onPress={() => navigation.navigate("OnboardingGenres")}
            style={({ pressed }) => [
              styles.continueButton,
              !canAdvance
                ? styles.continueButtonDisabled
                : styles.continueButtonEnabled,
              pressed ? styles.continueButtonPressed : undefined
            ]}
            testID="onboarding-artists-next-button"
          >
            <View style={styles.continueContent}>
              <AppText
                style={
                  !canAdvance
                    ? styles.continueLabelDisabled
                    : styles.continueLabelEnabled
                }
                variant="buttonLarge"
              >
                {t("onboarding.artists.continue")}
              </AppText>
              <Icon
                color={!canAdvance ? colors.neutrals[400] : colors.primary[500]}
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
  backButton: {
    alignItems: "flex-start",
    justifyContent: "center",
    width: 48
  },
  content: {
    flex: 1,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4]
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
  description: {
    gap: spacing[2]
  },
  footer: {
    gap: spacing[2],
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
    flex: 1,
    overflow: "hidden"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: spacing[4]
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderColor: colors.neutrals[700],
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    height: 48,
    marginTop: spacing[4],
    paddingHorizontal: spacing[3]
  },
  searchInput: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    height: "100%"
  },
  selectionCount: {
    textAlign: "center"
  },
  errorMessage: {
    color: colors.error[300]
  },
  statusMessage: {
    marginTop: spacing[4],
    textAlign: "center"
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
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    lineHeight: 37
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
  }
});
