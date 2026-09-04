import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, Screen } from "@/components/ui";
import { spacing } from "@/theme";

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen contentContainerStyle={styles.content} testID="home-screen">
      <View style={styles.hero}>
        <AppText variant="title">{t("home.title")}</AppText>
        <AppText color="muted">{t("home.subtitle")}</AppText>
      </View>

      <View style={styles.actions}>
        <Button label={t("home.primaryAction")} onPress={() => undefined} />
        <Button label={t("home.secondaryAction")} onPress={() => undefined} variant="secondary" />
        {/* Temporary access until US7 supplies the real navigation entry. */}
        <Button
          label="Tela de Detalhes da Recorda"
          onPress={() => navigation.navigate("RecordaDetails")}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing[2],
    width: "100%"
  },
  content: {
    gap: spacing[8],
    justifyContent: "center"
  },
  hero: {
    gap: spacing[2]
  }
});
