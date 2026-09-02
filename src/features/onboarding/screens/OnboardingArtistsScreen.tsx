import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "../providers/OnboardingContext";
import { ArtistChip } from "../components/ArtistChip";
import { searchArtistsMock } from "@/services/api/mock/artists";
import { Artist } from "@/types/artist";

// ─── Figma design tokens ──────────────────────────────────────────────────────
const COLORS = {
  background: "#151515",
  surface: "#292929",
  primary: "#00E2A9",
  primaryDeep: "#002D22",
  textPrimary: "#EAEAEA",
  textSecondary: "#BFBFBF",
  textOnChip: "#F4FFFC",
  stepperInactive: "#3E3E3E",
};

const MIN_ARTISTS = 3;
const TOTAL_STEPS = 3;

export function OnboardingArtistsScreen() {
  const { selectedArtists, toggleArtist } = useOnboarding();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await searchArtistsMock(query);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAdvance = selectedArtists.length >= MIN_ARTISTS;

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Stepper ─────────────────────────────────────────────────── */}
      <View style={styles.stepperRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stepperBar,
              i === 0 && { backgroundColor: COLORS.primary },
            ]}
          />
        ))}
      </View>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.etapaLabel}>ETAPA 1 DE 3</Text>
          <Text style={styles.title}>Quem faz parte da{"\n"}sua história?</Text>
          <Text style={styles.subtitle}>
            Escolha pelo menos 3 artistas para personalizar suas recordações.
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artistas"
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            selectionColor={COLORS.primary}
          />
        </View>

        {/* Results */}
        <ScrollView
          contentContainerStyle={styles.chipsContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            <>
              {results.map((artist) => {
                const isSelected = selectedArtists.some((a) => a.id === artist.id);
                return (
                  <ArtistChip
                    key={artist.id}
                    artist={artist}
                    selected={isSelected}
                    onPress={() => toggleArtist(artist)}
                  />
                );
              })}
              {hasSearched && results.length === 0 && (
                <Text style={styles.emptyText}>Nenhum artista encontrado.</Text>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {selectedArtists.length > 0 && (
            <Text style={styles.selectionCount}>
              {selectedArtists.length} artista{selectedArtists.length !== 1 ? "s" : ""} selecionado{selectedArtists.length !== 1 ? "s" : ""}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.button, !canAdvance && styles.buttonDisabled]}
            disabled={!canAdvance}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonLabel}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Stepper
  stepperRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepperBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.stepperInactive,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },

  // Header
  headerSection: {
    gap: 8,
    marginTop: 16,
  },
  etapaLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 56,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.textPrimary,
  },

  // Chips area
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  loader: {
    marginTop: 24,
    alignSelf: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    flex: 1,
  },

  // Footer
  footer: {
    gap: 8,
    marginTop: "auto",
  },
  selectionCount: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary,
  },
  button: {
    height: 58,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.background,
  },
});
