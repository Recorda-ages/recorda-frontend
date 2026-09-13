import { StyleSheet } from "react-native";

import { AppText } from "@/components/ui";
import { colors } from "@/theme";

type AuthFormErrorProps = {
  message?: string | null;
};

export function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <AppText accessibilityLiveRegion="polite" style={styles.message} variant="body2">
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  message: {
    color: colors.error[200],
    textAlign: "center"
  }
});
