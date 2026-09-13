import { Image } from "expo-image";
import { Pressable, StyleSheet } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

import type { MusicSelection } from "../types";

type ArtistChipProps = {
  artist: MusicSelection;
  selected: boolean;
  onPress: () => void;
};

export function ArtistChip({ artist, selected, onPress }: ArtistChipProps) {
  return (
    <Pressable
      accessibilityLabel={artist.name}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed ? styles.chipPressed : undefined
      ]}
      testID={`artist-chip-${artist.id}`}
    >
      {artist.imageUrl ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: artist.imageUrl }}
          style={styles.avatar}
          transition={150}
        />
      ) : null}
      <AppText
        numberOfLines={1}
        style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}
        variant="buttonSmall"
      >
        {artist.name}
      </AppText>
      {selected ? <Icon color={colors.primary[500]} size={16} source="check" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 16,
    height: 32,
    width: 32
  },
  chip: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: spacing[2],
    height: 40,
    paddingLeft: spacing[1],
    paddingRight: spacing[3]
  },
  chipPressed: {
    opacity: 0.8
  },
  chipSelected: {
    backgroundColor: colors.primary[900],
    borderColor: colors.primary[500],
    borderWidth: 1.5
  },
  chipUnselected: {
    backgroundColor: colors.secondary[900],
    borderColor: colors.secondary[800],
    borderWidth: 1
  },
  label: {
    letterSpacing: 0.46
  },
  labelSelected: {
    color: colors.primary[100]
  },
  labelUnselected: {
    color: colors.secondary[100]
  }
});
