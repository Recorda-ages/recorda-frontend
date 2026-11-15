import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

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
            <View style={[styles.content, columns ? styles.centeredContent : undefined]}>
              <AppText
                numberOfLines={1}
                style={[
                  selected ? styles.selectedLabel : styles.unselectedLabel,
                  columns ? styles.centeredLabel : undefined
                ]}
                variant="buttonSmall"
              >
                {option.label}
              </AppText>
              {selected ? (
                <Icon
                  color={colors.primary[500]}
                  size={16}
                  source="check"
                  testID="filter-chip-check"
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// Same look as the onboarding artist and genre chips.
const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  centeredContent: {
    justifyContent: "center"
  },
  centeredLabel: {
    textAlign: "center"
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2]
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
    backgroundColor: colors.primary[900],
    borderColor: colors.primary[500]
  },
  selectedLabel: {
    color: colors.secondary[100]
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
    backgroundColor: "transparent",
    borderColor: colors.neutrals[700]
  },
  unselectedLabel: {
    color: colors.neutrals[200]
  }
});
