import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { baseColors, semanticColors, radius, spacing } from "@/theme";

import { AppText } from "./Text";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
};

export function Button({
  disabled = false,
  label,
  loading = false,
  style,
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? baseColors.white : semanticColors.actionPrimary} />
      ) : (
        <AppText
          style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}
          variant="buttonLarge"
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3]
  },
  disabled: {
    opacity: 0.56
  },
  pressed: {
    opacity: 0.82
  },
  primary: {
    backgroundColor: semanticColors.actionPrimary
  },
  primaryLabel: {
    color: baseColors.white
  },
  secondary: {
    backgroundColor: semanticColors.background,
    borderColor: semanticColors.border,
    borderWidth: 1
  },
  secondaryLabel: {
    color: semanticColors.textPrimary
  }
});
