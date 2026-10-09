import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

export type FilterChipOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type FilterChipsProps<TValue extends string> = {
  columns?: 2 | 3;
  disabled?: boolean;
  onChange: (value: TValue) => void;
  options: readonly FilterChipOption<TValue>[];
  value: TValue;
};

export function FilterChips<TValue extends string>({
  columns,
  disabled = false,
  onChange,
  options,
  value
}: Readonly<FilterChipsProps<TValue>>) {
  return (
    <View accessibilityRole="radiogroup" style={styles.group}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              columns === 2 ? styles.twoColumnChip : undefined,
              columns === 3 ? styles.threeColumnChip : undefined,
              selected ? styles.selectedChip : styles.unselectedChip,
              disabled ? styles.disabled : undefined,
              pressed ? styles.pressed : undefined
            ]}
          >
            <AppText
              style={[
                selected ? styles.selectedLabel : styles.unselectedLabel,
                columns ? styles.centeredLabel : undefined
              ]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  centeredLabel: {
    textAlign: "center"
  },
  disabled: {
    opacity: 0.56
  },
  group: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2]
  },
  pressed: {
    opacity: 0.82
  },
  selectedChip: {
    backgroundColor: colors.primary[700]
  },
  selectedLabel: {
    color: colors.neutrals[100]
  },
  twoColumnChip: {
    flexBasis: "45%",
    flexGrow: 1
  },
  threeColumnChip: {
    flexBasis: "28%",
    flexGrow: 1
  },
  unselectedChip: {
    backgroundColor: colors.neutrals[700]
  },
  unselectedLabel: {
    color: colors.neutrals[200]
  }
});
