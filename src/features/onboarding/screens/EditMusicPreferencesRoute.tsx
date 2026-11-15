import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  CommonActions,
  useNavigation,
  usePreventRemove,
  type NavigationAction
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Button, ErrorState, Loading } from "@/components/ui";
import { ACCOUNT_QUERY_KEY } from "@/features/account/queryKeys";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { USER_SUGGESTIONS_QUERY_KEY } from "@/features/follow/queryKeys";
import { profileQueryKey } from "@/features/profile/queryKeys";
import { getSessionGeneration } from "@/services/api/sessionLifecycle";
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
  const myUserId = useCurrentUser()?.user_id;
  // Who saved, and in which session: the profile is refreshed only if it is still theirs.
  const saveSession = useRef<{ generation: number; userId: string | undefined } | null>(null);

  const [draft, setDraft] = useState<MusicPreferences>(initialPreferences);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [allowRemoval, setAllowRemoval] = useState(false);
  const pendingRemovalAction = useRef<NavigationAction | null>(null);

  const hasChanges = hasPreferencesChanged(draft, initialPreferences);

  const showDiscardConfirmation = (onDiscard: () => void) => {
    Alert.alert(
      t("settings.musicPreferences.discardTitle"),
      t("settings.musicPreferences.discardMessage"),
      [
        {
          text: t("common.continueEditing", "Continuar editando"),
          style: "cancel",
          onPress: () => {
            pendingRemovalAction.current = null;
          }
        },
        {
          text: t("common.discard", "Descartar"),
          style: "destructive",
          onPress: onDiscard
        }
      ]
    );
  };

  const allowRemovalAndDispatch = (action: NavigationAction) => {
    pendingRemovalAction.current = action;
    setAllowRemoval(true);
  };

  usePreventRemove(hasChanges && !allowRemoval, ({ data }) => {
    pendingRemovalAction.current = data.action;
    showDiscardConfirmation(() => allowRemovalAndDispatch(data.action));
  });

  useEffect(() => {
    if (!allowRemoval || !pendingRemovalAction.current) return;

    const action = pendingRemovalAction.current;
    pendingRemovalAction.current = null;
    navigation.dispatch(action);
  }, [allowRemoval, navigation]);

  const savePreferences = (preferences: MusicPreferences) => {
    saveSession.current = { generation: getSessionGeneration(), userId: myUserId };
    return saveMusicPreferences(preferences);
  };

  const finishEditing = async () => {
    queryClient.setQueryData(MUSIC_PREFERENCES_QUERY_KEY, draft);
    const session = saveSession.current;
    // The profile's favorite song comes from these preferences; its chips already read
    // the preferences cache set above.
    const profileUserId =
      session?.userId && session.generation === getSessionGeneration() ? session.userId : undefined;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: USER_SUGGESTIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["feed", "general"] }),
      profileUserId
        ? queryClient.invalidateQueries({
            // Only the profile (favorite song); the Recordas grid did not change.
            exact: true,
            queryKey: profileQueryKey(profileUserId)
          })
        : Promise.resolve()
    ]);

    const state = navigation.getState();
    const settingsRoute = state.routes[state.index - 1];
    if (settingsRoute?.name === "Settings") {
      navigation.dispatch({
        ...CommonActions.setParams({ notice: t("settings.musicPreferences.updated") }),
        source: settingsRoute.key
      });
    }

    allowRemovalAndDispatch(CommonActions.goBack());
  };

  if (step === 1) {
    return (
      <OnboardingArtistsScreen
        continueLabel={t("onboarding.artists.continue")}
        headerTitle={t("settings.musicPreferences.title")}
        onBack={() => navigation.goBack()}
        onContinue={() => setStep(2)}
        onSelectedArtistsChange={(artists) => setDraft((current) => ({ ...current, artists }))}
        selectedArtists={draft.artists}
      />
    );
  }

  if (step === 2) {
    return (
      <OnboardingGenresScreen
        continueLabel={t("onboarding.genres.continue")}
        headerTitle={t("settings.musicPreferences.title")}
        onBack={() => setStep(1)}
        onContinue={() => setStep(3)}
        onSelectedGenresChange={(genres) => setDraft((current) => ({ ...current, genres }))}
        selectedGenres={draft.genres}
      />
    );
  }

  return (
    <OnboardingMusicScreen
      finishLabel={t("settings.musicPreferences.save")}
      getPopularTracks={getPopularTracks}
      headerTitle={t("settings.musicPreferences.title")}
      onBack={() => setStep(2)}
      onComplete={finishEditing}
      onSelectTrack={(track) => setDraft((current) => ({ ...current, track }))}
      savePreferences={savePreferences}
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
