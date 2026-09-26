import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

// Temporary destinations for the demo feed. Replace these route components with
// the sharing (Epic 8) and reporting flows when those features are available.
export function RecordaIntegrationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "RecordaShare" | "RecordaReport">>();
  const sharing = route.name === "RecordaShare";

  return (
    <SafeAreaView style={styles.screen}>
      <AppText variant="headline3" style={styles.text}>
        {t(sharing ? "feed.share" : "publishedRecorda.report")}
      </AppText>
      <AppText style={styles.text}>
        {t(sharing ? "publishedRecorda.sharePending" : "publishedRecorda.reportPending")}
      </AppText>
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
