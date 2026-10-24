import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Button, ErrorState, Loading } from "@/components/ui";
import { USER_SUGGESTIONS_QUERY_KEY } from "@/features/follow/queryKeys";
import { baseColors, spacing } from "@/theme";

import {
  getMusicPreferences,
  getPopularTracks,
  saveMusicPreferences,
  searchTracks
} from "../api/music";
import { MUSIC_PREFERENCES_QUERY_KEY } from "../queryKeys";
import type { MusicPreferences, MusicSelection } from "../types";
import { OnboardingArtistsScreen } from "./OnboardingArtistsScreen";
import { OnboardingGenresScreen } from "./OnboardingGenresScreen";
import { OnboardingMusicScreen } from "./OnboardingMusicScreen";

export const USER_PROFILE_QUERY_KEY = ["users", "me", "profile"] as const;

function sameSelections(left: MusicSelection[], right: MusicSelection[]) {
  if (left.length !== right.length) return false;
  return left.every((item) => right.some((other) => other.id === item.id));
}

function hasPreferencesChanged(draft: MusicPreferences, original: MusicPreferences) {
  return (
    !sameSelections(draft.artists, original.artists) ||
    !sameSelections(draft.genres, original.genres) ||
    draft.track.id !== original.track.id
  );
}

export function EditMusicPreferencesRoute() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const preferencesQuery = useQuery({
    queryKey: MUSIC_PREFERENCES_QUERY_KEY,
    queryFn: ({ signal }) => getMusicPreferences(signal)
  });

  if (preferencesQuery.isPending) {
    return (
      <View style={styles.centerContainer}>
        <Loading
          label={t("settings.musicPreferences.loading", "Carregando preferências musicais")}
        />
      </View>
    );
  }

  if (preferencesQuery.isError) {
    return (
      <View style={styles.errorContainer}>
        <ErrorState
          message={t(
            "settings.musicPreferences.loadError",
            "Não foi possível carregar suas preferências."
          )}
        />
        <View style={styles.errorButtons}>
          <Button
            label={t("common.retry", "Tentar novamente")}
            onPress={() => void preferencesQuery.refetch()}
          />
          <Button
            label={t("common.back", "Voltar")}
            onPress={() => navigation.goBack()}
            variant="secondary"
          />
        </View>
      </View>
    );
  }

  if (!preferencesQuery.data) {
    return null;
  }

  return <EditMusicPreferencesWizard initialPreferences={preferencesQuery.data} />;
}

export function EditMusicPreferencesWizard({
  initialPreferences
}: {
  initialPreferences: MusicPreferences;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<MusicPreferences>(initialPreferences);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const hasChanges = hasPreferencesChanged(draft, initialPreferences);

  const requestExit = useCallback(() => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      t("settings.musicPreferences.discardTitle", "Descartar alterações?"),
      t("settings.musicPreferences.discardMessage", "Suas escolhas ainda não foram salvas."),
      [
        { text: t("common.continueEditing", "Continuar editando"), style: "cancel" },
        {
          text: t("common.discard", "Descartar"),
          style: "destructive",
          onPress: () => navigation.goBack()
        }
      ]
    );
  }, [hasChanges, navigation, t]);

  usePreventRemove(hasChanges, ({ data }) => {
    Alert.alert(
      t("settings.musicPreferences.discardTitle", "Descartar alterações?"),
      t("settings.musicPreferences.discardMessage", "Suas escolhas ainda não foram salvas."),
      [
        { text: t("common.continueEditing", "Continuar editando"), style: "cancel" },
        {
          text: t("common.discard", "Descartar"),
          style: "destructive",
          onPress: () => navigation.dispatch(data.action)
        }
      ]
    );
  });

  const finishEditing = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: USER_SUGGESTIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["feed", "general"] }),
      queryClient.invalidateQueries({ queryKey: MUSIC_PREFERENCES_QUERY_KEY })
    ]);

    navigation.goBack();
  };

  if (step === 1) {
    return (
      <OnboardingArtistsScreen
        continueLabel={t("common.next", "Avançar")}
        headerTitle={t("settings.musicPreferences.title", "Editar preferências")}
        onBack={requestExit}
        onContinue={() => setStep(2)}
        onSelectedArtistsChange={(artists) => setDraft((current) => ({ ...current, artists }))}
        selectedArtists={draft.artists}
      />
    );
  }

  if (step === 2) {
    return (
      <OnboardingGenresScreen
        continueLabel={t("common.next", "Avançar")}
        headerTitle={t("settings.musicPreferences.title", "Editar preferências")}
        onBack={() => setStep(1)}
        onContinue={() => setStep(3)}
        onSelectedGenresChange={(genres) => setDraft((current) => ({ ...current, genres }))}
        selectedGenres={draft.genres}
      />
    );
  }

  return (
    <OnboardingMusicScreen
      finishLabel={t("common.save", "Salvar")}
      getPopularTracks={getPopularTracks}
      headerTitle={t("settings.musicPreferences.title", "Editar preferências")}
      onBack={() => setStep(2)}
      onComplete={finishEditing}
      onSelectTrack={(track) => setDraft((current) => ({ ...current, track }))}
      savePreferences={saveMusicPreferences}
      searchTracks={searchTracks}
      selectedArtists={draft.artists}
      selectedGenres={draft.genres}
      selectedTrack={draft.track}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: "center",
    backgroundColor: baseColors.black,
    flex: 1,
    justifyContent: "center",
    padding: spacing[4]
  },
  errorButtons: {
    gap: spacing[2],
    marginTop: spacing[4],
    width: "100%"
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: baseColors.black,
    flex: 1,
    justifyContent: "center",
    padding: spacing[4]
  }
});
