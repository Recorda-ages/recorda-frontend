import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, StyleSheet } from "react-native";

import { colors, withOpacity } from "@/theme";

const SPINNER_SIZE = 40;

/** Ring spinner shown over a Recorda video while it loads (native-driven rotation). */
export function VideoLoadingSpinner() {
  const { t } = useTranslation();
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        duration: 900,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      accessibilityLabel={t("feed.videoLoading")}
      accessibilityRole="progressbar"
      style={[styles.spinner, { transform: [{ rotate }] }]}
      testID="recorda-video-loading"
    />
  );
}

const styles = StyleSheet.create({
  spinner: {
    borderColor: withOpacity(colors.primary[500], 0.2),
    borderRadius: SPINNER_SIZE / 2,
    borderTopColor: colors.primary[500],
    borderWidth: 3,
    height: SPINNER_SIZE,
    width: SPINNER_SIZE
  }
});
