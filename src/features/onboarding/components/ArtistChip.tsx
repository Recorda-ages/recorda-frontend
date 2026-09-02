import React from "react";
import { StyleSheet, Image, Text, TouchableOpacity } from "react-native";
import { Artist } from "@/types/artist";

// Design tokens extraídos do Figma (node 562:5932)
// Chip selecionado: fill #002D22, radius 20, padding L:4 R:14, gap 10
// Imagem: 32x32, circular
// Texto: fontSize 12, fontWeight 500, color #F4FFFC
// Chip não selecionado: borda #3E3E3E, texto #A9A9A9

const COLORS = {
  chipSelected: "#002D22",
  chipUnselected: "transparent",
  chipBorderUnselected: "#3E3E3E",
  chipTextSelected: "#F4FFFC",
  chipTextUnselected: "#A9A9A9",
};

interface ArtistChipProps {
  artist: Artist;
  selected: boolean;
  onPress: () => void;
}

export function ArtistChip({ artist, selected, onPress }: ArtistChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
      ]}
    >
      {artist.imageUrl && (
        <Image
          source={{ uri: artist.imageUrl }}
          style={styles.avatar}
        />
      )}
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelUnselected,
        ]}
        numberOfLines={1}
      >
        {artist.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 20,
    paddingLeft: 4,
    paddingRight: 14,
    gap: 10,
  },
  chipSelected: {
    backgroundColor: COLORS.chipSelected,
  },
  chipUnselected: {
    backgroundColor: COLORS.chipUnselected,
    borderWidth: 1,
    borderColor: COLORS.chipBorderUnselected,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
  labelSelected: {
    color: COLORS.chipTextSelected,
  },
  labelUnselected: {
    color: COLORS.chipTextUnselected,
  },
});
