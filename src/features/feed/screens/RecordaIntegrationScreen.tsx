import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

// Temporary sharing destination for the demo feed. Replace this route component
// when every sharing entry point uses the Epic 8 flow.
export function RecordaIntegrationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.screen}>
      <AppText variant="headline3" style={styles.text}>
        {t("feed.share")}
      </AppText>
      <AppText style={styles.text}>{t("publishedRecorda.sharePending")}</AppText>
      <Button label={t("publishedRecorda.back")} onPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[4],
    backgroundColor: colors.neutrals[900]
  },
  text: { color: colors.neutrals[100] }
});
