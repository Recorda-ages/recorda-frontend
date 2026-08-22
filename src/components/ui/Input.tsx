import type { TextInputProps } from "react-native";
import { StyleSheet, TextInput, View } from "react-native";

import { semanticColors, radius, spacing, typography } from "@/theme";

import { AppText } from "./Text";

type InputProps = TextInputProps & {
  error?: string;
  label?: string;
};

export function Input({ error, label, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <AppText color="muted" variant="body2">
          {label}
        </AppText>
      ) : null}
      <TextInput
        accessibilityHint={error}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={semanticColors.textDisabled}
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
    gap: spacing[1]
  },
  error: {
    color: semanticColors.error
  },
  input: {
    backgroundColor: semanticColors.background,
    borderColor: semanticColors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: semanticColors.textPrimary,
    ...typography.body1,
    minHeight: 48,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  inputError: {
    borderColor: semanticColors.error
  }
});
