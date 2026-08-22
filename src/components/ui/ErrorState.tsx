import { StyleSheet, View } from "react-native";

import { colors, semanticColors, radius, spacing } from "@/theme";

import { AppText } from "./Text";

type ErrorStateProps = {
  message: string;
  title?: string;
};

export function ErrorState({ message, title }: ErrorStateProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      {title ? (
        <AppText style={styles.title} variant="headline4">
          {title}
        </AppText>
      ) : null}
      <AppText color="muted">{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error[100],
    borderColor: semanticColors.error,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing[1],
    padding: spacing[3]
  },
  title: {
    color: semanticColors.error
  }
});
