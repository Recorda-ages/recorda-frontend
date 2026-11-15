import { StyleSheet, View } from "react-native";

import { baseColors, radius, spacing, withOpacity } from "@/theme";

type DayPaginationSegmentsProps = Readonly<{
  activeIndex: number;
  count: number;
}>;

/** Barra segmentada do topo: um segmento por Recorda do dia, o ativo em destaque. */
export function DayPaginationSegments({ activeIndex, count }: DayPaginationSegmentsProps) {
  return (
    <View style={styles.row} testID="day-pagination-segments">
      {Array.from({ length: count }, (_, index) => (
        <View
          accessibilityState={{ selected: index === activeIndex }}
          key={index}
          style={[styles.segment, index === activeIndex && styles.active]}
          testID={`day-pagination-segment-${index}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: baseColors.white
  },
  row: {
    flexDirection: "row",
    gap: spacing[1]
  },
  segment: {
    backgroundColor: withOpacity(baseColors.white, 0.35),
    borderRadius: radius.full,
    flex: 1,
    height: 3
  }
});
