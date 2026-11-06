import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { baseColors, colors, radius, spacing } from "@/theme";

type RemoveRecordaButtonProps = {
  disabled?: boolean;
  onPress: () => void;
};

export function RemoveRecordaButton({
  disabled = false,
  onPress
}: Readonly<RemoveRecordaButtonProps>) {
  const { t } = useTranslation();
  const label = t("admin.reportDetail.removeRecorda.button");

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : undefined,
        pressed ? styles.pressed : undefined
      ]}
      testID="admin-report-remove-recorda"
    >
      <AppText style={styles.label} variant="buttonLarge">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.error[300],
    borderRadius: radius.xl,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing[4]
  },
  disabled: {
    opacity: 0.56
  },
  label: {
    color: baseColors.white
  },
  pressed: {
    opacity: 0.82
  }
});
