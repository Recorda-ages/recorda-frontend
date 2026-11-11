import { Image, type ImageSource } from "expo-image";
import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

const CHIP_IMAGE_SIZE = 32;
const ICON_SIZE = 18;
const SPIN_DURATION = 3000;
const SPIN_TURNS = 1000;
const VINYL_HOLE_SIZE = 8;

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
  onPress?: () => void;
  spinning?: boolean;
  testID: string;
  tone?: ProfileInfoChipTone;
  vinyl?: boolean;
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
  onPress,
  spinning = false,
  testID,
  tone = "default",
  vinyl = false
}: ProfileInfoChipProps) {
  const toneStyle = TONES[tone];
  const [rotation] = useState(() => new Animated.Value(0));
  const [rotate] = useState(() =>
    Animated.modulo(rotation, 1).interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"]
    })
  );

  useEffect(() => {
    if (!spinning) {
      rotation.stopAnimation();
      return;
    }
    rotation.stopAnimation((value) => {
      Animated.timing(rotation, {
        duration: SPIN_DURATION * SPIN_TURNS,
        easing: Easing.linear,
        toValue: value + SPIN_TURNS,
        useNativeDriver: true
      }).start();
    });
    return () => rotation.stopAnimation();
  }, [rotation, spinning]);

  const content = (
    <>
      {imageSource ? (
        <Animated.View style={vinyl ? { transform: [{ rotate }] } : undefined}>
          <Image
            contentFit="cover"
            source={imageSource}
            style={styles.image}
            testID={`${testID}-image`}
          />
          {vinyl ? <View pointerEvents="none" style={styles.vinylHole} /> : null}
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.image, styles.icon, toneStyle.icon, vinyl && { transform: [{ rotate }] }]}
        >
          <Icon color={toneStyle.iconColor} size={ICON_SIZE} source={icon} />
        </Animated.View>
      )}
      <AppText numberOfLines={1} style={[styles.label, toneStyle.label]}>
        {label}
      </AppText>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: spinning }}
        onPress={onPress}
        style={[styles.chip, toneStyle.chip]}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible
      style={[styles.chip, toneStyle.chip]}
      testID={testID}
    >
      {content}
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
  },
  vinylHole: {
    backgroundColor: colors.neutrals[900],
    borderRadius: VINYL_HOLE_SIZE / 2,
    height: VINYL_HOLE_SIZE,
    left: (CHIP_IMAGE_SIZE - VINYL_HOLE_SIZE) / 2,
    position: "absolute",
    top: (CHIP_IMAGE_SIZE - VINYL_HOLE_SIZE) / 2,
    width: VINYL_HOLE_SIZE
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
