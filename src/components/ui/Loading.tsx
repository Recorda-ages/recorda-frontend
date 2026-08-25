import { ActivityIndicator, StyleSheet, View } from "react-native";

import { semanticColors, spacing } from "@/theme";

import { AppText } from "./Text";

type LoadingProps = {
  label?: string;
};

export function Loading({ label }: LoadingProps) {
  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color={semanticColors.actionPrimary} />
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
    gap: spacing[2],
    justifyContent: "center",
    padding: spacing[5]
  }
});
