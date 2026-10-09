import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

type AdminPendingScreenProps = {
  title: string;
};

export function AdminPendingScreen({ title }: Readonly<AdminPendingScreenProps>) {
  return (
    <View style={styles.screen} testID="admin-pending-screen">
      <AppText style={styles.title} variant="headline4">
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.neutrals[900],
    flex: 1,
    justifyContent: "center",
    padding: spacing[6]
  },
  title: {
    color: colors.neutrals[100]
  }
});
