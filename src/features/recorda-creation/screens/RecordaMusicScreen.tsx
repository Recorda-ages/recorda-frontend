import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
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

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { useTrackSearch } from "@/features/music/hooks/useTrackSearch";
import type { Track } from "@/features/music/services/musicService";
import { baseColors, colors, fontFamily, radius, spacing, withOpacity } from "@/theme";

import { useRecordaDraft } from "../context/RecordaDraftContext";
import type { RecordaDraftSong } from "../types";

const SEARCH_DEBOUNCE_MS = 350;

export function toDraftSong(track: Track): RecordaDraftSong {
  return {
    artistName: track.artist,
    coverUrl: track.cover_url ?? "",
    deezerTrackId: String(track.id),
    previewUrl: track.preview_url,
    title: track.title
  };
}

export function RecordaMusicScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { media, setSong, song } = useRecordaDraft();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<RecordaDraftSong | null>(song);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useTrackSearch(debouncedQuery);
  const isWaitingDebounce = query.trim() !== debouncedQuery;
  const hasQuery = debouncedQuery.length > 0;
  const tracks = hasQuery ? (search.data ?? []) : [];

  const player = useVideoPlayer(media?.type === "video" ? media.uri : null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  const handleNext = () => {
    if (!selectedSong) {
      return;
    }

    setSong(selectedSong);
    navigation.navigate("RecordaDetails");
  };

  return (
    <SafeAreaView style={styles.screen} testID="recorda-music-screen">
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t("recordaMusic.back")}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.topBarAction}
        >
          <Icon color={colors.neutrals[100]} size={32} source="chevron-left" />
        </Pressable>
        <AppText style={styles.topBarTitle} variant="headline4">
          {t("recordaMusic.header")}
        </AppText>
        <View style={styles.topBarAction} />
      </View>

      <View style={styles.content}>
        <View style={styles.search}>
          <TextInput
            accessibilityLabel={t("recordaMusic.search")}
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder={t("recordaMusic.search")}
            placeholderTextColor={colors.neutrals[200]}
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          {query.trim() && (isWaitingDebounce || search.isFetching) ? (
            <ActivityIndicator
              accessibilityLabel={t("recordaMusic.loading")}
              color={colors.primary[500]}
              size="small"
            />
          ) : (
            <Icon color={colors.neutrals[200]} size={24} source="magnify" />
          )}
        </View>

        <View style={styles.stage} testID="recorda-music-preview">
          {media?.type === "video" ? (
            <VideoView
              contentFit="cover"
              nativeControls={false}
              player={player}
              style={StyleSheet.absoluteFill}
            />
          ) : media ? (
            <Image contentFit="cover" source={media.uri} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.previewEmpty}>
              <AppText style={styles.muted}>{t("recordaMusic.noMedia")}</AppText>
            </View>
          )}
          <View style={styles.stageOverlay} />

          <FlatList
            contentContainerStyle={styles.list}
            data={isWaitingDebounce ? [] : tracks}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <SearchFeedback
                hasQuery={hasQuery && !isWaitingDebounce}
                isError={search.isError}
                isSuccess={search.isSuccess}
                onRetry={() => void search.refetch()}
              />
            }
            renderItem={({ item }) => {
              const isSelected = selectedSong?.deezerTrackId === String(item.id);

              return (
                <Pressable
                  accessibilityLabel={`${item.title}, ${item.artist}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => setSelectedSong(toDraftSong(item))}
                  style={[styles.track, isSelected ? styles.trackSelected : undefined]}
                >
                  {item.cover_url ? (
                    <Image source={item.cover_url} style={styles.trackCover} />
                  ) : (
                    <View style={[styles.trackCover, styles.coverFallback]}>
                      <Icon color={colors.neutrals[200]} size={24} source="music-note" />
                    </View>
                  )}
                  <View style={styles.flex}>
                    <AppText numberOfLines={1} style={styles.trackTitle}>
                      {item.title}
                    </AppText>
                    <AppText numberOfLines={1} style={styles.muted}>
                      {item.artist}
                    </AppText>
                  </View>
                  <Icon
                    color={colors.primary[500]}
                    size={24}
                    source={isSelected ? "radiobox-marked" : "radiobox-blank"}
                  />
                </Pressable>
              );
            }}
            style={styles.resultsOverlay}
          />
        </View>

        <View style={styles.nextButtonSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.nextButtonWrap}
      >
        <Pressable
          accessibilityLabel={t("recordaMusic.next")}
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectedSong }}
          disabled={!selectedSong}
          onPress={handleNext}
          style={[styles.nextButton, !selectedSong ? styles.nextButtonDisabled : undefined]}
          testID="recorda-music-next-button"
        >
          <AppText
            style={selectedSong ? styles.nextLabel : styles.nextLabelDisabled}
            variant="buttonLarge"
          >
            {t("recordaMusic.next")}
          </AppText>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type SearchFeedbackProps = {
  hasQuery: boolean;
  isError: boolean;
  isSuccess: boolean;
  onRetry: () => void;
};

function SearchFeedback({ hasQuery, isError, isSuccess, onRetry }: SearchFeedbackProps) {
  const { t } = useTranslation();

  if (!hasQuery) {
    return <AppText style={styles.feedback}>{t("recordaMusic.hint")}</AppText>;
  }

  if (isError) {
    return (
      <View style={styles.feedbackGroup}>
        <AppText accessibilityRole="alert" style={styles.error}>
          {t("recordaMusic.searchError")}
        </AppText>
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <AppText color="primary">{t("recordaMusic.retry")}</AppText>
        </Pressable>
      </View>
    );
  }

  if (isSuccess) {
    return <AppText style={styles.feedback}>{t("recordaMusic.empty")}</AppText>;
  }

  return null;
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  coverFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[700],
    justifyContent: "center"
  },
  error: {
    color: colors.error[200]
  },
  feedback: {
    color: colors.neutrals[200],
    paddingVertical: spacing[4],
    textAlign: "center"
  },
  feedbackGroup: {
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[4]
  },
  flex: {
    flex: 1
  },
  input: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    minWidth: 0,
    paddingVertical: spacing[4]
  },
  list: {
    gap: spacing[2],
    paddingBottom: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2]
  },
  muted: {
    color: colors.neutrals[200]
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    justifyContent: "center",
    marginBottom: spacing[6],
    marginHorizontal: spacing[4],
    minHeight: 58
  },
  nextButtonDisabled: {
    backgroundColor: colors.neutrals[700]
  },
  nextButtonSpacer: {
    height: 58,
    marginTop: spacing[4]
  },
  nextButtonWrap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0
  },
  nextLabel: {
    color: colors.neutrals[900]
  },
  nextLabelDisabled: {
    color: colors.neutrals[400]
  },
  previewEmpty: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center"
  },
  resultsOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.md,
    flexDirection: "row",
    marginBottom: spacing[4],
    marginHorizontal: spacing[4],
    minHeight: 56,
    paddingHorizontal: spacing[6]
  },
  stage: {
    borderRadius: 28,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: spacing[4],
    overflow: "hidden",
    position: "relative"
  },
  stageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: baseColors.black,
    opacity: 0.35
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: spacing[4]
  },
  topBarAction: {
    justifyContent: "center",
    width: 48
  },
  topBarTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold
  },
  track: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.neutrals[900], 0.55),
    borderColor: withOpacity(baseColors.white, 0.12),
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[3]
  },
  trackCover: {
    borderRadius: radius.sm,
    height: 48,
    width: 48
  },
  trackSelected: {
    backgroundColor: withOpacity(colors.primary[500], 0.22),
    borderColor: colors.primary[500]
  },
  trackTitle: {
    color: colors.neutrals[100]
  }
});
