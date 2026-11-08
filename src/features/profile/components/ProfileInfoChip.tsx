import { Image, type ImageSource } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

const CHIP_IMAGE_SIZE = 32;
const ICON_SIZE = 18;

/**
 * - `default`: music chips (song, artist, genre).
 * - `highlight`: same shape on a dark green background, e.g. an active streak.
 * - `muted`: the regular dark gray background with a discreet icon and label, e.g. no streak.
 */
export type ProfileInfoChipTone = "default" | "highlight" | "muted";

type ProfileInfoChipProps = Readonly<{
  accessibilityLabel: string;
  /** Shown when there is no image. */
  icon: string;
  imageSource?: ImageSource;
  label: string;
  testID: string;
  tone?: ProfileInfoChipTone;
}>;

/**
 * One cell of the ProfileHeader's information grid: picture (or icon) and a one-line label
 * that ends in "…" when too long. Only presentation; whoever renders it resolves the image.
 */
export function ProfileInfoChip({
  accessibilityLabel,
  icon,
  imageSource,
  label,
  testID,
  tone = "default"
}: ProfileInfoChipProps) {
  const toneStyle = TONES[tone];

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible
      style={[styles.chip, toneStyle.chip]}
      testID={testID}
    >
      {imageSource ? (
        <Image
          contentFit="cover"
          source={imageSource}
          style={styles.image}
          testID={`${testID}-image`}
        />
      ) : (
        <View style={[styles.image, styles.icon, toneStyle.icon]}>
          <Icon color={toneStyle.iconColor} size={ICON_SIZE} source={icon} />
        </View>
      )}
      <AppText numberOfLines={1} style={[styles.label, toneStyle.label]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing[2],
    minHeight: CHIP_IMAGE_SIZE + spacing[2],
    paddingLeft: spacing[1],
    paddingRight: spacing[3],
    width: "48%"
  },
  icon: {
    alignItems: "center",
    justifyContent: "center"
  },
  image: {
    borderRadius: CHIP_IMAGE_SIZE / 2,
    height: CHIP_IMAGE_SIZE,
    width: CHIP_IMAGE_SIZE
  },
  label: {
    flexShrink: 1
  }
});

const TONES = {
  default: {
    chip: { backgroundColor: colors.secondary[900] },
    icon: { backgroundColor: colors.primary[500] },
    iconColor: colors.neutrals[900],
    label: { color: colors.neutrals[100] }
  },
  highlight: {
    chip: { backgroundColor: colors.primary[800] },
    icon: { backgroundColor: colors.primary[500] },
    iconColor: colors.neutrals[900],
    label: { color: colors.neutrals[100] }
  },
  muted: {
    chip: { backgroundColor: colors.secondary[900] },
    icon: { backgroundColor: colors.neutrals[700] },
    iconColor: colors.neutrals[400],
    label: { color: colors.neutrals[300] }
  }
} as const;
