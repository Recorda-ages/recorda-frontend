import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { useArtistSearch } from "@/features/music/hooks/useArtistSearch";
import { colors, fontFamily, spacing } from "@/theme";

import { ArtistChip, type ArtistOption } from "../components/ArtistChip";
import { useOnboarding } from "../state/OnboardingContext";

const MIN_ARTISTS = 3;

export function OnboardingArtistsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedArtists, setSelectedArtists } = useOnboarding();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const backgroundScale = width / 393;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useArtistSearch(debouncedQuery);
  const selectedArtistIds = useMemo(
    () => selectedArtists.map((artist) => artist.id),
    [selectedArtists]
  );
  const canAdvance = selectedArtists.length >= MIN_ARTISTS;
  const hasSearched = debouncedQuery.length > 0;

  const artistOptions = useMemo<ArtistOption[]>(() => {
    const results =
      search.data?.map((artist) => ({
        id: artist.id,
        name: artist.name,
        pictureUrl: artist.picture_url ?? undefined
      })) ?? [];

    return [
      ...selectedArtists,
      ...results.filter((artist) => !selectedArtistIds.includes(artist.id))
    ];
  }, [search.data, selectedArtistIds, selectedArtists]);

  const toggleArtist = (artist: ArtistOption) => {
    setSelectedArtists((currentArtists) =>
      currentArtists.some((selectedArtist) => selectedArtist.id === artist.id)
        ? currentArtists.filter((selectedArtist) => selectedArtist.id !== artist.id)
        : [...currentArtists, { id: artist.id, name: artist.name }]
    );
  };

  return (
    <SafeAreaView style={styles.screen} testID="onboarding-artists-screen">
      <StatusBar style="light" />
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

      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Voltar"
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
          Artistas
        </AppText>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.content}>
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
            ETAPA 1 DE 3
          </AppText>

          <View style={styles.description}>
            <AppText style={styles.title} variant="headline2">
              Quem faz parte da sua história?
            </AppText>
            <AppText color="muted" style={styles.subtitle}>
              Escolha pelo menos 3 artistas para personalizar suas recordações.
            </AppText>
          </View>

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
            ) : (
              <Icon color={colors.neutrals[200]} size={24} source="magnify" />
            )}
          </View>

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

          {search.isError ? (
            <AppText accessibilityRole="alert" style={styles.error}>
              Não foi possível buscar artistas. Verifique sua conexão.
            </AppText>
          ) : null}

          {hasSearched && search.isSuccess && artistOptions.length === 0 ? (
            <AppText style={styles.empty}>Nenhum artista encontrado.</AppText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityLabel="Próximo"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAdvance }}
            disabled={!canAdvance}
            onPress={() => navigation.navigate("OnboardingGenres")}
            style={({ pressed }) => [
              styles.continueButton,
              canAdvance ? styles.continueButtonEnabled : styles.continueButtonDisabled,
              pressed ? styles.continueButtonPressed : undefined
            ]}
            testID="onboarding-artists-next-button"
          >
            <View style={styles.continueContent}>
              <AppText
                style={canAdvance ? styles.continueLabelEnabled : styles.continueLabelDisabled}
                variant="buttonLarge"
              >
                Próximo
              </AppText>
              <Icon
                color={canAdvance ? colors.primary[500] : colors.neutrals[400]}
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
  input: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 14,
    minWidth: 0,
    paddingVertical: spacing[4]
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
  search: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: 8,
    flexDirection: "row",
    marginTop: spacing[5],
    minHeight: 56,
    paddingHorizontal: spacing[6]
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
    fontFamily: fontFamily.primary.semiBold
  }
});
