import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

import { useSettings } from "../hooks/useSettings";

type Props = { onSignOut: () => Promise<void> };
type Confirmation = "private" | "public" | "signOut";

export function SettingsScreen({ onSignOut }: Readonly<Props>) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings, update } = useSettings();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const confirmLock = useRef(false);
  const busy = update.isPending || signingOut;

  const confirm = async () => {
    if (!confirmation || confirmLock.current || busy) return;
    confirmLock.current = true;
    setConfirmation(null);
    if (confirmation === "signOut") {
      setSigningOut(true);
      setSignOutError(false);
      try {
        await onSignOut();
      } catch {
        setSignOutError(true);
      } finally {
        setSigningOut(false);
        confirmLock.current = false;
      }
      return;
    }
    update.mutate(
      { is_private: confirmation === "private" },
      {
        onSettled: () => {
          confirmLock.current = false;
        }
      }
    );
  };

  const row = (destination: "account" | "music" | "language", icon: string) => (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={() => navigation.navigate("SettingsPending", { destination })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon color={colors.primary[500]} size={22} source={icon} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.label}>{t(`settings.${destination}`)}</AppText>
        {destination === "music" ? (
          <AppText style={styles.support}>{t("settings.musicSupport")}</AppText>
        ) : null}
      </View>
      <Icon color={colors.primary[500]} size={24} source="chevron-right" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} testID="settings-screen">
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t("settings.back")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Icon color={colors.neutrals[100]} size={28} source="chevron-left" />
        </Pressable>
        <AppText style={styles.title}>{t("settings.title")}</AppText>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText style={styles.section}>{t("settings.accountSection")}</AppText>
        {row("account", "account-outline")}
        {settings.isPending ? <Loading label={t("settings.loading")} /> : null}
        {settings.isError ? (
          <View style={styles.feedback}>
            <ErrorState message={t("settings.loadError")} />
            <Button
              disabled={busy}
              label={t("settings.retry")}
              onPress={() => void settings.refetch()}
            />
          </View>
        ) : null}
        {settings.data ? (
          <View style={styles.row}>
            <View style={styles.icon}>
              <Icon color={colors.primary[500]} size={22} source="lock-outline" />
            </View>
            <View style={styles.copy}>
              <AppText style={styles.label}>{t("settings.privateAccount")}</AppText>
              <AppText style={styles.support}>
                {t(settings.data.is_private ? "settings.privateSupport" : "settings.publicSupport")}
              </AppText>
            </View>
            <Switch
              accessibilityState={{
                checked: settings.data.is_private,
                disabled: busy || settings.isFetching || settings.isError,
                busy
              }}
              accessibilityLabel={t("settings.privateAccount")}
              accessibilityHint={t(
                settings.data.is_private ? "settings.privateSupport" : "settings.publicSupport"
              )}
              disabled={busy || settings.isFetching || settings.isError}
              onValueChange={(value) => {
                update.reset();
                setConfirmation(value ? "private" : "public");
              }}
              trackColor={{ false: colors.neutrals[600], true: colors.primary[700] }}
              thumbColor={colors.neutrals[100]}
              value={settings.data.is_private}
            />
          </View>
        ) : null}
        {update.isPending ? <Loading label={t("settings.saving")} /> : null}
        {update.isError ? <ErrorState message={t("settings.updateError")} /> : null}
        {update.isSuccess && !update.data.is_private && update.data.accepted_requests > 0 ? (
          <AppText accessibilityLiveRegion="polite" style={styles.success}>
            {t("settings.accepted", { count: update.data.accepted_requests })}
          </AppText>
        ) : null}
        <AppText style={styles.section}>{t("settings.preferencesSection")}</AppText>
        {row("music", "music-note-outline")}
        {row("language", "web")}
        <AppText style={styles.section}>{t("settings.sessionSection")}</AppText>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => setConfirmation("signOut")}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <Icon color={colors.error[300]} size={22} source="logout" />
          <AppText style={styles.signOutLabel}>{t("settings.signOut")}</AppText>
          <Icon color={colors.error[300]} size={24} source="chevron-right" />
        </Pressable>
        {signOutError ? <ErrorState message={t("settings.signOutError")} /> : null}
      </ScrollView>
      {confirmation !== null ? (
        <Modal
          animationType="fade"
          onRequestClose={() => setConfirmation(null)}
          transparent
          visible
        >
          <View style={styles.backdrop}>
            <View accessibilityViewIsModal style={styles.dialog}>
              <Icon
                color={colors.primary[500]}
                size={32}
                source={
                  confirmation === "private"
                    ? "lock-outline"
                    : confirmation === "public"
                      ? "lock-open-outline"
                      : "logout"
                }
              />
              <AppText style={styles.title}>{t(`settings.confirm.${confirmation}.title`)}</AppText>
              <AppText style={styles.message}>
                {t(`settings.confirm.${confirmation}.message`)}
              </AppText>
              <Button label={t("settings.confirmAction")} onPress={() => void confirm()} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmation(null)}
                style={styles.cancel}
              >
                <AppText style={styles.label}>{t("settings.cancel")}</AppText>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.neutrals[900], flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing[4]
  },
  back: { width: 32, minHeight: 44, justifyContent: "center" },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 20,
    textAlign: "center"
  },
  content: { paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
  section: {
    color: colors.neutrals[300],
    fontSize: 12,
    fontFamily: fontFamily.primary.semiBold,
    marginTop: spacing[6],
    marginBottom: spacing[2]
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    minHeight: 78,
    paddingVertical: spacing[4],
    borderBottomColor: colors.neutrals[700],
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary[900]
  },
  copy: { flex: 1, gap: spacing[1] },
  label: { color: colors.neutrals[100], fontFamily: fontFamily.primary.semiBold, fontSize: 14 },
  support: { color: colors.neutrals[300], fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.7 },
  feedback: { gap: spacing[3], paddingVertical: spacing[4] },
  success: { color: colors.primary[300], paddingVertical: spacing[3] },
  signOut: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    minHeight: 56,
    borderColor: colors.error[300],
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.error[500]
  },
  signOutLabel: { color: colors.error[200], flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[5]
  },
  dialog: {
    backgroundColor: colors.neutrals[800],
    borderRadius: 20,
    padding: spacing[6],
    width: "100%",
    maxWidth: 400,
    gap: spacing[4]
  },
  message: { color: colors.neutrals[200], fontSize: 14, lineHeight: 22 },
  cancel: { alignItems: "center", justifyContent: "center", minHeight: 44 }
});
