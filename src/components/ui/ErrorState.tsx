import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./Text";

type ErrorStateProps = {
  message: string;
  title?: string;
};

export function ErrorState({ message, title }: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      {title ? (
        <AppText style={styles.title} variant="subtitle">
          {title}
        </AppText>
      ) : null}
      <AppText color="muted">{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  title: {
    color: colors.danger
  }
});
