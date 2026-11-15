import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const GLOW_SOURCE = require("@/assets/images/glow.png");

const GLOW_SIZE = 440;

type ProfileGlowProps = Readonly<{
  /** Vertical center of the glow in screen coordinates, usually the avatar's center. */
  centerY: number;
}>;

/**
 * Green glow behind the profile avatar. Drawn by the screen as a fixed layer behind the top
 * bar and the scroll, so no container clips it and the content scrolls over it seamlessly.
 */
export function ProfileGlow({ centerY }: ProfileGlowProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { top: centerY - GLOW_SIZE / 2 }]}
      testID="profile-glow"
    >
      <Image contentFit="contain" source={GLOW_SOURCE} style={styles.glow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0
  },
  glow: {
    height: GLOW_SIZE,
    opacity: 0.3,
    width: GLOW_SIZE
  }
});
