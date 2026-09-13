import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

import type { MusicSelection } from "../types";

export type ArtistOption = MusicSelection & {
  pictureUrl?: string;
};

type ArtistChipProps = {
  artist: ArtistOption;
  onPress: () => void;
  selected: boolean;
};

export function ArtistChip({ artist, onPress, selected }: ArtistChipProps) {
  return (
    <Pressable
      accessibilityLabel={artist.name}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
    >
      {artist.pictureUrl ? (
        <Image cachePolicy="memory-disk" source={artist.pictureUrl} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Icon color={colors.neutrals[100]} size={18} source="account-music" />
        </View>
      )}
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
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[700],
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  chip: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[2],
    height: 40,
    paddingLeft: 4,
    paddingRight: 14
  },
  chipSelected: {
    backgroundColor: colors.primary[900],
    borderColor: colors.primary[500]
  },
  chipUnselected: {
    backgroundColor: "transparent",
    borderColor: colors.neutrals[700]
  },
  label: {
    maxWidth: 164
  },
  labelSelected: {
    color: colors.secondary[100]
  },
  labelUnselected: {
    color: colors.neutrals[200]
  }
});
