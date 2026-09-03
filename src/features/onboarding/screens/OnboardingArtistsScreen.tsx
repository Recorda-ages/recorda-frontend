import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
<<<<<<< HEAD
=======
import { LinearGradient } from "expo-linear-gradient";
>>>>>>> 48c7b64 (ajuste design parte 1)
import { Ionicons } from "@expo/vector-icons";
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
<<<<<<< HEAD
  stepperInactive: "#002D22"
=======
  stepperInactive: "#3E3E3E"
>>>>>>> 48c7b64 (ajuste design parte 1)
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

  const displayedArtists = [
    ...selectedArtists,
    ...results.filter((r) => !selectedArtists.some((sa) => sa.id === r.id))
  ];

  return (
<<<<<<< HEAD
    <View style={styles.root}>
=======
    <LinearGradient
      colors={["rgba(0, 226, 169, 0.15)", COLORS.background]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.3 }}
      style={styles.root}
    >
>>>>>>> 48c7b64 (ajuste design parte 1)
      <SafeAreaView style={styles.safeArea}>
        {/* ── Top Header ──────────────────────────────────────────────── */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backButton}>
<<<<<<< HEAD
            <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
=======
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
>>>>>>> 48c7b64 (ajuste design parte 1)
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Artistas</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Stepper ─────────────────────────────────────────────────── */}
        <View style={styles.stepperRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.stepperBar, i === 0 && { backgroundColor: COLORS.primary }]}
            />
          ))}
        </View>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <View style={styles.body}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.etapaLabel}>ETAPA 1 DE 3</Text>
<<<<<<< HEAD
            <Text style={styles.title}>Quem faz parte da sua história?</Text>
=======
            <Text style={styles.title}>Quem faz parte da{"\n"}sua história?</Text>
>>>>>>> 48c7b64 (ajuste design parte 1)
            <Text style={styles.subtitle}>
              Escolha pelo menos 3 artistas para personalizar suas recordações.
            </Text>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
<<<<<<< HEAD
=======
            <Text style={styles.searchIcon}>🔍</Text>
>>>>>>> 48c7b64 (ajuste design parte 1)
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
<<<<<<< HEAD
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
=======
>>>>>>> 48c7b64 (ajuste design parte 1)
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
                {displayedArtists.map((artist) => {
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
                {hasSearched && displayedArtists.length === 0 && (
                  <Text style={styles.emptyText}>Nenhum artista encontrado.</Text>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {selectedArtists.length > 0 && (
              <Text style={styles.selectionCount}>
                {selectedArtists.length} artista{selectedArtists.length !== 1 ? "s" : ""}{" "}
                selecionado{selectedArtists.length !== 1 ? "s" : ""}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.button, !canAdvance && styles.buttonDisabled]}
              disabled={!canAdvance}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonLabel, !canAdvance && styles.buttonLabelDisabled]}>
                Próximo
              </Text>
<<<<<<< HEAD
              <Ionicons
                name="chevron-forward"
                size={24}
                color={!canAdvance ? COLORS.primary : COLORS.background}
              />
=======
>>>>>>> 48c7b64 (ajuste design parte 1)
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
<<<<<<< HEAD
    </View>
=======
    </LinearGradient>
>>>>>>> 48c7b64 (ajuste design parte 1)
  );
}

const styles = StyleSheet.create({
  root: {
<<<<<<< HEAD
    flex: 1,
    backgroundColor: COLORS.background
  },
  safeArea: {
    flex: 1,
    zIndex: 1
=======
    flex: 1
  },
  safeArea: {
    flex: 1
>>>>>>> 48c7b64 (ajuste design parte 1)
  },

  // Top Header
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12
  },
  backButton: {
    padding: 8,
    width: 40
  },
  topHeaderTitle: {
<<<<<<< HEAD
    fontSize: 20,
    fontWeight: "700",
=======
    fontSize: 16,
    fontWeight: "600",
>>>>>>> 48c7b64 (ajuste design parte 1)
    color: COLORS.textPrimary
  },

  // Stepper
  stepperRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  stepperBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.stepperInactive
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16
  },

  // Header
  headerSection: {
    gap: 8,
    marginTop: 16
  },
  etapaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    letterSpacing: 0.5
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.textPrimary,
<<<<<<< HEAD
    lineHeight: 37
=======
    lineHeight: 36
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: COLORS.textSecondary,
<<<<<<< HEAD
    lineHeight: 22
=======
    lineHeight: 20
>>>>>>> 48c7b64 (ajuste design parte 1)
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    gap: 8
<<<<<<< HEAD
=======
  },
  searchIcon: {
    fontSize: 16
>>>>>>> 48c7b64 (ajuste design parte 1)
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: COLORS.textPrimary
  },

  // Chips area
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  loader: {
    marginTop: 24,
    alignSelf: "center"
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    flex: 1
  },

  // Footer
  footer: {
    gap: 8,
    marginTop: "auto"
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
    textAlign: "center"
  },
  button: {
    height: 58,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
<<<<<<< HEAD
    justifyContent: "center",
    gap: 8
  },
  buttonDisabled: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: 0.46,
    color: COLORS.background
  },
  buttonLabelDisabled: {
    color: COLORS.primary
=======
    justifyContent: "center"
  },
  buttonDisabled: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.textSecondary
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.background
  },
  buttonLabelDisabled: {
    color: COLORS.textSecondary
>>>>>>> 48c7b64 (ajuste design parte 1)
  }
});
