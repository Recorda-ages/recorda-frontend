import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, radius, spacing } from "@/theme";

import type { AdminStatus } from "../types";
import { StatusBadge } from "./StatusBadge";

type AdminListRowProps = {
  accessibilityLabel?: string;
  metadata?: string;
  onPress?: () => void;
  status?: AdminStatus;
  subtitle?: string;
  title: string;
};

export function AdminListRow({
  accessibilityLabel,
  metadata,
  onPress,
  status,
  subtitle,
  title
}: Readonly<AdminListRowProps>) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : undefined]}
    >
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.title} variant="body1">
          {title}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={1} style={styles.subtitle} variant="body2">
            {subtitle}
          </AppText>
        ) : null}
        {metadata ? (
          <AppText numberOfLines={1} style={styles.metadata} variant="caption">
            {metadata}
          </AppText>
        ) : null}
      </View>
      {status ? <StatusBadge status={status} /> : null}
      {onPress ? (
        <AppText accessibilityElementsHidden style={styles.chevron}>
          ›
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chevron: {
    color: colors.neutrals[300],
    fontSize: 24
  },
  copy: {
    flex: 1,
    gap: spacing[1]
  },
  metadata: {
    color: colors.neutrals[400]
  },
  pressed: {
    opacity: 0.82
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing[3],
    minHeight: 72,
    padding: spacing[3]
  },
  subtitle: {
    color: colors.neutrals[200]
  },
  title: {
    color: colors.neutrals[100]
  }
});
