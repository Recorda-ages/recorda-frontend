import { Image } from "expo-image";
import { StyleSheet } from "react-native";

const GLOW_SOURCE = require("@/assets/images/glow.png");

export function FeedGlow() {
  return (
    <Image
      accessibilityElementsHidden
      contentFit="contain"
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      source={GLOW_SOURCE}
      style={styles.glow}
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    height: 520,
    opacity: 0.28,
    position: "absolute",
    right: -230,
    top: -270,
    width: 520
  }
});
