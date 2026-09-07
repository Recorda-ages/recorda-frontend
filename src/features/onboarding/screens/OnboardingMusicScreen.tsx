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
  View,
  useWindowDimensions
} from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";
import type { MusicPreferences, MusicTrack } from "../types";

export type OnboardingMusicScreenProps = {
  selectedTrack: MusicTrack | null;
  selectedArtistIds: number[];
  selectedGenreIds: number[];
  onSelectTrack: (track: MusicTrack) => void;
  onBack: () => void;
  onComplete: () => void;
  searchTracks: (query: string, signal: AbortSignal) => Promise<MusicTrack[]>;
  savePreferences: (preferences: MusicPreferences) => Promise<void>;
};

export function OnboardingMusicScreen({
  selectedTrack,
  selectedArtistIds,
  selectedGenreIds,
  onSelectTrack,
  onBack,
  onComplete,
  searchTracks,
  savePreferences
}: OnboardingMusicScreenProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const submitting = useRef(false);
  const scale = useWindowDimensions().width / 393;
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);
  const results = useQuery({
    queryKey: ["music", "tracks", debouncedQuery],
    queryFn: ({ signal }) => searchTracks(debouncedQuery, signal),
    enabled: debouncedQuery.length > 0,
    retry: false
  });
  const save = useMutation({ mutationFn: savePreferences, onSuccess: onComplete });
  const waiting = query.trim() !== debouncedQuery;
  const disabled = !selectedTrack || save.isPending;
  const submit = async () => {
    if (!selectedTrack || submitting.current) return;
    submitting.current = true;
    try {
      await save.mutateAsync({
        artistIds: selectedArtistIds,
        genreIds: selectedGenreIds,
        track: selectedTrack
      });
    } catch {
      // Mutation state displays the error; the host keeps all selections intact.
    } finally {
      submitting.current = false;
    }
  };

  return (
    <SafeAreaView style={styles.screen} testID="onboarding-music-screen">
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={require("../assets/gradient-glow.svg")}
          style={{
            position: "absolute",
            width: 894 * scale,
            height: 894 * scale,
            left: -446 * scale,
            top: -468 * scale
          }}
        />
        <Image
          source={require("../assets/gradient-glow.svg")}
          style={{
            position: "absolute",
            width: 894 * scale,
            height: 894 * scale,
            left: 34 * scale,
            bottom: -271 * scale
          }}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("onboarding.music.back")}
            disabled={save.isPending}
            onPress={onBack}
            style={styles.back}
          >
            <Icon source="chevron-left" size={32} color={colors.secondary[100]} />
          </Pressable>
          <AppText variant="headline4" style={styles.header}>
            {t("onboarding.music.header")}
          </AppText>
          <View style={styles.back} />
        </View>
        <View style={styles.content}>
          <Image
            source={require("../assets/music-stepper.svg")}
            style={styles.progress}
            contentFit="fill"
          />
          <FlatList
            data={!waiting && debouncedQuery ? (results.data ?? []) : []}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <>
                <AppText color="primary" variant="body2" style={styles.step}>
                  {t("onboarding.music.step")}
                </AppText>
                <AppText variant="headline2" style={styles.title}>
                  {t("onboarding.music.title")}
                </AppText>
                <AppText style={styles.subtitle}>{t("onboarding.music.subtitle")}</AppText>
                <View style={styles.search}>
                  <TextInput
                    accessibilityLabel={t("onboarding.music.search")}
                    placeholder={t("onboarding.music.search")}
                    placeholderTextColor={colors.neutrals[200]}
                    value={query}
                    onChangeText={setQuery}
                    style={styles.input}
                    returnKeyType="search"
                    autoCorrect={false}
                  />
                  <Icon source="magnify" color={colors.neutrals[200]} size={24} />
                </View>
                {selectedTrack ? (
                  <View style={styles.selection}>
                    <Icon source="check-circle" color={colors.primary[500]} size={24} />
                    <AppText style={styles.light}>
                      {t("onboarding.music.selected", {
                        title: selectedTrack.title,
                        artist: selectedTrack.artist
                      })}
                    </AppText>
                  </View>
                ) : null}
                {query.trim() && (waiting || results.isFetching) ? (
                  <ActivityIndicator
                    accessibilityLabel={t("onboarding.music.loading")}
                    color={colors.primary[500]}
                    style={styles.feedback}
                  />
                ) : null}
                {!waiting && debouncedQuery && results.isError ? (
                  <View style={styles.feedback}>
                    <AppText style={styles.error}>{t("onboarding.music.searchError")}</AppText>
                    <Pressable accessibilityRole="button" onPress={() => void results.refetch()}>
                      <AppText color="primary">{t("onboarding.music.retry")}</AppText>
                    </Pressable>
                  </View>
                ) : null}
                {!waiting && debouncedQuery && results.isSuccess && !results.data.length ? (
                  <AppText style={styles.subtitle}>{t("onboarding.music.empty")}</AppText>
                ) : null}
              </>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={`${item.title}, ${item.artist}`}
                accessibilityState={{
                  checked: selectedTrack?.id === item.id,
                  disabled: save.isPending
                }}
                disabled={save.isPending}
                onPress={() => onSelectTrack(item)}
                style={[
                  styles.track,
                  selectedTrack?.id === item.id ? styles.trackSelected : undefined
                ]}
              >
                {item.artworkUrl ? (
                  <Image source={item.artworkUrl} style={styles.artwork} contentFit="cover" />
                ) : (
                  <Icon source="music-note" size={40} color={colors.neutrals[200]} />
                )}
                <View style={styles.flex}>
                  <AppText style={styles.light}>{item.title}</AppText>
                  <AppText style={styles.artist}>{item.artist}</AppText>
                </View>
                <Icon
                  source={selectedTrack?.id === item.id ? "radiobox-marked" : "radiobox-blank"}
                  size={24}
                  color={colors.primary[500]}
                />
              </Pressable>
            )}
          />
          <View style={styles.footer}>
            {save.isError ? (
              <AppText accessibilityRole="alert" style={styles.error}>
                {t("onboarding.music.saveError")}
              </AppText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.music.finish")}
              accessibilityState={{ disabled, busy: save.isPending }}
              disabled={disabled}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.finish,
                disabled ? styles.finishDisabled : undefined,
                pressed ? styles.pressed : undefined
              ]}
            >
              {save.isPending ? (
                <ActivityIndicator color={colors.neutrals[800]} />
              ) : (
                <AppText variant="buttonLarge" style={styles.finishLabel}>
                  {t("onboarding.music.finish")}
                </AppText>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutrals[900], overflow: "hidden" },
  flex: { flex: 1 },
  topBar: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4]
  },
  back: { width: 48, height: 48, justifyContent: "center" },
  header: { color: colors.secondary[100], fontFamily: fontFamily.primary.semiBold },
  content: { flex: 1, paddingHorizontal: spacing[4], paddingBottom: spacing[6] },
  progress: { width: "100%", height: 4, marginBottom: spacing[4] },
  list: { paddingBottom: spacing[4] },
  step: { lineHeight: 18, letterSpacing: 0.15, marginBottom: spacing[4] },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    lineHeight: 37.35
  },
  subtitle: {
    color: colors.neutrals[200],
    lineHeight: 21,
    letterSpacing: 0.15,
    marginTop: spacing[2],
    marginBottom: spacing[4]
  },
  search: {
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: colors.neutrals[800],
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4]
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing[4],
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.regular,
    fontSize: 14
  },
  selection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    marginBottom: spacing[2],
    flexWrap: "wrap"
  },
  light: { color: colors.neutrals[100], flexShrink: 1 },
  artist: { color: colors.neutrals[200], marginTop: 4 },
  track: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutrals[700],
    marginBottom: spacing[2],
    backgroundColor: colors.neutrals[800]
  },
  trackSelected: { borderColor: colors.primary[500], backgroundColor: colors.primary[900] },
  artwork: { height: 48, width: 48, borderRadius: 8 },
  feedback: { padding: spacing[4], gap: spacing[3] },
  error: { color: colors.error[200], lineHeight: 21 },
  footer: { gap: spacing[3], paddingTop: spacing[4] },
  finish: {
    minHeight: 58,
    borderRadius: 100,
    backgroundColor: colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4]
  },
  finishDisabled: { backgroundColor: colors.neutrals[400] },
  finishLabel: {
    color: colors.neutrals[800],
    fontFamily: fontFamily.primary.bold,
    lineHeight: 26,
    letterSpacing: 0.46,
    textAlign: "center"
  },
  pressed: { opacity: 0.82 }
});
