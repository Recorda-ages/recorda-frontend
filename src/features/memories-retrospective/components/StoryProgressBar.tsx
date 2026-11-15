import { Animated, StyleSheet, View } from "react-native";

import { baseColors, colors, radius, spacing, withOpacity } from "@/theme";

type StoryProgressBarProps = Readonly<{
  activeIndex: number;
  count: number;
  /** 0 a 1: quanto do slide ativo já passou. */
  progress: Animated.Value;
}>;

/** Barras do topo: as anteriores cheias, a ativa enchendo com o tempo, as seguintes vazias. */
export function StoryProgressBar({ activeIndex, count, progress }: StoryProgressBarProps) {
  return (
    <View style={styles.row} testID="story-progress-bar">
      {Array.from({ length: count }, (_, index) => (
        <View
          accessibilityState={{ selected: index === activeIndex }}
          key={index}
          style={styles.track}
          testID={`story-progress-segment-${index}`}
        >
          <Animated.View
            style={[
              styles.fill,
              {
                width:
                  index === activeIndex
                    ? progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                    : index < activeIndex
                      ? "100%"
                      : "0%"
              }
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.primary[500],
    height: "100%"
  },
  row: {
    flexDirection: "row",
    gap: spacing[1]
  },
  track: {
    backgroundColor: withOpacity(baseColors.white, 0.25),
    borderRadius: radius.full,
    flex: 1,
    height: 3,
    overflow: "hidden"
  }
});
