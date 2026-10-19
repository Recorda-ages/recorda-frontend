import { StyleSheet, View } from "react-native";

import { Button, ErrorState } from "@/components/ui";
import { spacing } from "@/theme";

type AdminRetryBlockProps = {
  message: string;
  onRetry: () => void;
  retryLabel: string;
};

export function AdminRetryBlock({ message, onRetry, retryLabel }: AdminRetryBlockProps) {
  return (
    <View style={styles.container}>
      <ErrorState message={message} />
      <Button label={retryLabel} onPress={onRetry} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    padding: spacing[4]
  }
});
