import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/theme";

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
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <AppText style={isPrimary ? styles.primaryLabel : styles.secondaryLabel} variant="button">
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  disabled: {
    opacity: 0.56
  },
  pressed: {
    opacity: 0.82
  },
  primary: {
    backgroundColor: colors.primary
  },
  primaryLabel: {
    color: colors.onPrimary
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
  },
  secondaryLabel: {
    color: colors.text
  }
});
