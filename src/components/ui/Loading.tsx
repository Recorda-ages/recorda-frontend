import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme";

import { AppText } from "./Text";

type LoadingProps = {
  label?: string;
};

export function Loading({ label }: LoadingProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      {label ? (
        <AppText color="muted" variant="caption">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.lg
  }
});
