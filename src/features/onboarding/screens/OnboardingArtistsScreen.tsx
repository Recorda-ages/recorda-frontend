import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Icon } from "react-native-paper";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, ErrorState, Loading } from "@/components/ui";
import { clearSession } from "@/features/auth/session";
import { useArtistSearch } from "@/features/music/hooks/useArtistSearch";
import { usePopularArtists } from "@/features/music/hooks/usePopularArtists";
import { colors, fontFamily, spacing } from "@/theme";

import { ArtistChip, type ArtistOption } from "../components/ArtistChip";
import { OnboardingStepLayout } from "../components/OnboardingStepLayout";
import { useOnboarding } from "../state/OnboardingContext";

const MIN_ARTISTS = 3;

export function OnboardingArtistsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedArtists, setSelectedArtists } = useOnboarding();
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
    setSelectedArtists((currentArtists) =>
      currentArtists.some((selectedArtist) => selectedArtist.id === artist.id)
        ? currentArtists.filter((selectedArtist) => selectedArtist.id !== artist.id)
        : [...currentArtists, { id: artist.id, name: artist.name, pictureUrl: artist.pictureUrl }]
    );
  };

  const goBack = async () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <OnboardingStepLayout
      activeStep={1}
      backAccessibilityLabel="Voltar"
      backButtonTestID="onboarding-artists-back-button"
      continueDisabled={!canAdvance}
      continueLabel="Próximo"
      continueTestID="onboarding-artists-next-button"
      headerTitle="Artistas"
      keyboardShouldPersistTaps="handled"
      onBack={() => void goBack()}
      onContinue={() => navigation.navigate("OnboardingGenres")}
      selectionCount={selectedArtists.length}
      stepLabel="ETAPA 1 DE 3"
      subtitle="Escolha pelo menos 3 artistas para personalizar suas recordações."
      testID="onboarding-artists-screen"
      title="Quem faz parte da sua história?"
    >
      <View style={styles.search}>
        <TextInput
          accessibilityLabel="Buscar artistas"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Buscar artistas"
          placeholderTextColor={colors.neutrals[200]}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        {search.isFetching ? (
          <ActivityIndicator color={colors.primary[500]} size="small" />
        ) : query.length > 0 ? (
          <Pressable
            accessibilityLabel="Limpar busca"
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

      {showPopularLoading ? <Loading label="Carregando artistas populares" /> : null}

      {showPopularError ? (
        <ErrorState message="Não foi possível carregar artistas populares." />
      ) : null}

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
          Não foi possível buscar artistas. Verifique sua conexão.
        </AppText>
      ) : null}

      {hasSearched && search.isSuccess && artistOptions.length === 0 ? (
        <AppText style={styles.empty}>Nenhum artista encontrado.</AppText>
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
