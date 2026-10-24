import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";
import type { MusicPreferences, MusicSelection, MusicTrack } from "../types";

export type OnboardingMusicScreenProps = {
  selectedTrack: MusicTrack | null;
  selectedArtists: MusicSelection[];
  selectedGenres: MusicSelection[];
  onSelectTrack: (track: MusicTrack) => void;
  onBack: () => void;
  onComplete: () => void | Promise<void>;
  searchTracks: (query: string, signal: AbortSignal) => Promise<MusicTrack[]>;
  getPopularTracks: (signal: AbortSignal) => Promise<MusicTrack[]>;
  savePreferences: (preferences: MusicPreferences) => Promise<void>;
  finishLabel?: string;
  headerTitle?: string;
  title?: string;
  subtitle?: string;
};

export function OnboardingMusicScreen({
  selectedTrack,
  selectedArtists,
  selectedGenres,
  onSelectTrack,
  onBack,
  onComplete,
  searchTracks,
  getPopularTracks,
  savePreferences,
  finishLabel,
  headerTitle,
  title,
  subtitle
}: OnboardingMusicScreenProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useQuery({
    queryKey: ["music", "tracks", "search", debouncedQuery],
    queryFn: ({ signal }) => searchTracks(debouncedQuery, signal),
    enabled: debouncedQuery.length > 0,
    retry: false
  });

  const popular = useQuery({
    queryKey: ["music", "tracks", "popular"],
    queryFn: ({ signal }) => getPopularTracks(signal),
    retry: false
  });

  const save = useMutation({
    mutationFn: savePreferences,
    onSuccess: async () => {
      await onComplete();
    }
  });

  const rawQuery = query.trim();
  const waiting = rawQuery !== debouncedQuery;
  const disabled = !selectedTrack || save.isPending;

  const submit = async () => {
    if (!selectedTrack || submitting.current) return;
    submitting.current = true;
    try {
      await save.mutateAsync({
        artists: selectedArtists,
        genres: selectedGenres,
        track: selectedTrack
      });
    } catch {
      // React Query exposes the failure through `save.isError` for an inline retry.
    } finally {
      submitting.current = false;
    }
  };

  const tracks = debouncedQuery.length > 0 ? (results.data ?? []) : (popular.data ?? []);
  const visibleTracks = selectedTrack
    ? [selectedTrack, ...tracks.filter((track) => track.id !== selectedTrack.id)]
    : tracks;
  const loading = debouncedQuery.length > 0 ? waiting || results.isPending : popular.isPending;
  const isError = debouncedQuery.length > 0 ? results.isError : popular.isError;
  const errorMessage =
    debouncedQuery.length > 0
      ? t("onboarding.music.searchError")
      : t("onboarding.music.popularError");
  const retry = () => {
    if (debouncedQuery.length > 0) {
      void results.refetch();
      return;
    }

    void popular.refetch();
  };
  const errorContent = (
    <View style={styles.center}>
      <AppText style={styles.emptyText}>{errorMessage}</AppText>
      <Button label={t("onboarding.music.retry")} onPress={retry} variant="secondary" />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t("onboarding.music.back")}
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            testID="onboarding-music-back-button"
          >
            <Icon color={colors.neutrals[100]} size={24} source="arrow-left" />
          </Pressable>
          <AppText style={styles.headerTitle}>
            {headerTitle ?? t("onboarding.music.header")}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={visibleTracks}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            ) : isError ? (
              errorContent
            ) : (
              <View style={styles.center}>
                <AppText style={styles.emptyText}>{t("onboarding.music.empty")}</AppText>
              </View>
            )
          }
          ListHeaderComponent={
            <View>
              <AppText style={styles.step}>{t("onboarding.music.step")}</AppText>
              <AppText style={styles.title}>{title ?? t("onboarding.music.title")}</AppText>
              <AppText style={styles.subtitle}>
                {subtitle ?? t("onboarding.music.subtitle")}
              </AppText>

              <View style={styles.search}>
                <Icon color={colors.neutrals[200]} size={20} source="magnify" />
                <TextInput
                  accessibilityLabel={t("onboarding.music.search")}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setQuery}
                  placeholder={t("onboarding.music.search")}
                  placeholderTextColor={colors.neutrals[200]}
                  returnKeyType="search"
                  style={styles.input}
                  value={query}
                />
                {query.length > 0 ? (
                  <Pressable
                    accessibilityLabel={t("onboarding.music.clearSearch")}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      setQuery("");
                      setDebouncedQuery("");
                    }}
                  >
                    <Icon color={colors.neutrals[200]} size={20} source="close-circle" />
                  </Pressable>
                ) : null}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedTrack?.id === item.id;
            return (
              <Pressable
                accessibilityLabel={`${item.title}, ${item.artist}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => onSelectTrack(item)}
                style={[styles.trackRow, isSelected && styles.trackRowSelected]}
              >
                {item.artworkUrl ? (
                  <Image source={{ uri: item.artworkUrl }} style={styles.artwork} />
                ) : (
                  <View style={[styles.artwork, styles.artworkPlaceholder]}>
                    <Icon color={colors.neutrals[200]} size={24} source="music" />
                  </View>
                )}
                <View style={styles.trackInfo}>
                  <AppText numberOfLines={1} style={styles.trackTitle}>
                    {item.title}
                  </AppText>
                  <AppText numberOfLines={1} style={styles.trackArtist}>
                    {item.artist}
                  </AppText>
                </View>
                {isSelected ? (
                  <Icon color={colors.primary[500]} size={22} source="check-circle" />
                ) : null}
              </Pressable>
            );
          }}
          ListFooterComponent={
            visibleTracks.length > 0 && loading ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            ) : visibleTracks.length > 0 && isError ? (
              errorContent
            ) : null
          }
        />

        <View style={styles.footer}>
          {save.isError ? (
            <AppText accessibilityRole="alert" style={styles.saveError}>
              {t("onboarding.music.saveError")}
            </AppText>
          ) : null}
          <Pressable
            accessibilityLabel={finishLabel ?? t("onboarding.music.finish")}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => void submit()}
            style={[styles.button, disabled && styles.buttonDisabled]}
            testID="onboarding-music-finish-button"
          >
            {save.isPending ? (
              <ActivityIndicator color={baseColors.black} />
            ) : (
              <AppText style={[styles.buttonLabel, disabled && styles.buttonLabelDisabled]}>
                {finishLabel ?? t("onboarding.music.finish")}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: 4,
    height: 48,
    width: 48
  },
  artworkPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.secondary[900],
    justifyContent: "center"
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: 24,
    height: 48,
    justifyContent: "center"
  },
  buttonDisabled: {
    backgroundColor: colors.neutrals[700],
    opacity: 0.6
  },
  buttonLabel: {
    color: baseColors.black,
    fontFamily: fontFamily.primary.bold,
    fontSize: 16
  },
  buttonLabelDisabled: {
    color: colors.neutrals[400]
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[6]
  },
  emptyText: {
    color: colors.neutrals[300],
    fontSize: 14,
    textAlign: "center"
  },
  footer: {
    borderTopColor: colors.neutrals[800],
    borderTopWidth: 1,
    gap: spacing[2],
    padding: spacing[4]
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 48,
    justifyContent: "space-between",
    paddingHorizontal: spacing[4]
  },
  headerSpacer: {
    width: 24
  },
  headerTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 16
  },
  input: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    paddingVertical: spacing[2]
  },
  keyboard: {
    flex: 1
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2]
  },
  safe: {
    backgroundColor: baseColors.black,
    flex: 1
  },
  saveError: {
    color: colors.error[500],
    fontSize: 13,
    marginBottom: spacing[1],
    textAlign: "center"
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing[2],
    marginVertical: spacing[4],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1]
  },
  step: {
    color: colors.primary[500],
    fontFamily: fontFamily.primary.regular,
    fontSize: 13,
    marginTop: spacing[2]
  },
  subtitle: {
    color: colors.neutrals[200],
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    marginTop: spacing[1]
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 22,
    marginTop: spacing[1]
  },
  trackArtist: {
    color: colors.neutrals[200],
    fontFamily: fontFamily.primary.regular,
    fontSize: 13,
    marginTop: 2
  },
  trackInfo: {
    flex: 1,
    marginLeft: spacing[3]
  },
  trackRow: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    padding: spacing[2]
  },
  trackRowSelected: {
    backgroundColor: colors.neutrals[900],
    borderColor: colors.primary[500],
    borderWidth: 1
  },
  trackTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 15
  }
});
