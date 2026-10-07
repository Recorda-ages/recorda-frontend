/**
 * ============================================================================
 * QA TEMPORÁRIO #228 — REMOVER ANTES DO COMMIT
 * ============================================================================
 *
 * Harness manual para abrir o `ReportDialog` no app sem integrar nenhum
 * consumidor real. Existe só para o QA visual e funcional da #228.
 *
 * Como remover:
 *   1. git checkout src/app/AppRoot.tsx
 *   2. rm QA-228-report-dialog.tsx
 *   3. grep -rn "QA TEMPORÁRIO #228" .   (deve voltar vazio)
 *
 * Usa exclusivamente a API pública da feature (`useReportDialog`). Nada em
 * src/features/moderation/ foi alterado para viabilizar este harness.
 */
import { SafeAreaView, StyleSheet, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { useReportDialog } from "@/features/moderation";
import { colors, spacing } from "@/theme";

const QA_RECORDA_ID = "11111111-1111-4111-8111-111111111111";
const QA_USER_ID = "22222222-2222-4222-8222-222222222222";

export function ReportDialogQAHarness() {
  const { openReport, reportDialog } = useReportDialog();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <AppText style={styles.title} variant="headline3">
          QA #228 — ReportDialog
        </AppText>
        <AppText style={styles.hint}>
          Harness temporário. Nenhum consumidor real foi integrado.
        </AppText>
        <Button
          label="Abrir denúncia de Recorda"
          onPress={() => openReport({ recordaId: QA_RECORDA_ID, type: "RECORDA" })}
        />
        <Button
          label="Abrir denúncia de perfil"
          onPress={() => openReport({ type: "USER", userId: QA_USER_ID })}
          variant="secondary"
        />
      </View>
      {reportDialog}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[4],
    width: "100%"
  },
  hint: {
    color: colors.neutrals[300],
    marginBottom: spacing[2],
    textAlign: "center"
  },
  screen: {
    alignItems: "center",
    backgroundColor: colors.neutrals[900],
    flex: 1,
    justifyContent: "center",
    padding: spacing[6]
  },
  title: {
    color: colors.neutrals[100],
    textAlign: "center"
  }
});
