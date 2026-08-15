import type { TextInputProps } from "react-native";
import { StyleSheet, TextInput, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

import { AppText } from "./Text";

type InputProps = TextInputProps & {
  error?: string;
  label?: string;
};

export function Input({ error, label, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <AppText color="muted" variant="label">
          {label}
        </AppText>
      ) : null}
      <TextInput
        accessibilityHint={error}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : undefined, style]}
        {...props}
      />
      {error ? (
        <AppText style={styles.error} variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs
  },
  error: {
    color: colors.danger
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.size.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  inputError: {
    borderColor: colors.danger
  }
});
