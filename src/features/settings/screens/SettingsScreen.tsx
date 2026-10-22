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
import { SignOutDialog } from "../components/SignOutDialog";

type Props = { onSignOut: () => Promise<void> };
type Confirmation = "private" | "public" | "signOut";
type Destination = RootStackParamList["SettingsPending"]["destination"];

const CONFIRMATION_ICONS: Record<Confirmation, string> = {
  private: "lock-outline",
  public: "lock-open-outline",
  signOut: "logout"
};

export function SettingsScreen({ onSignOut }: Readonly<Props>) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings, update, isUpdating } = useSettings();
  const signOut = useSignOutFlow(onSignOut);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmLock = useRef(false);
  const busy = isUpdating || signOut.signingOut;

  const confirm = () => {
    if (!confirmation || confirmLock.current || busy) return;
    confirmLock.current = true;
    setConfirmation(null);
    const release = () => {
      confirmLock.current = false;
    };
    if (confirmation === "signOut") {
      void signOut.run().finally(release);
      return;
    }
    update.mutate({ is_private: confirmation === "private" }, { onSettled: release });
  };

  const openPending = (destination: Destination) =>
    navigation.navigate("SettingsPending", { destination });

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
        <NavigationRow
          destination="account"
          disabled={busy}
          icon="account-outline"
          onPress={openPending}
        />
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
          <PrivacyRow
            busy={busy}
            disabled={busy || settings.isFetching || settings.isError}
            isPrivate={settings.data.is_private}
            onChange={(value) => {
              update.reset();
              setConfirmation(value ? "private" : "public");
            }}
          />
        ) : null}
        <PrivacyFeedback isUpdating={isUpdating} update={update} />
        <AppText style={styles.section}>{t("settings.preferencesSection")}</AppText>
        <NavigationRow
          destination="music"
          disabled={busy}
          icon="music-note-outline"
          onPress={openPending}
          support={t("settings.musicSupport")}
        />
        <NavigationRow destination="language" disabled={busy} icon="web" onPress={openPending} />
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
        {signOut.failed ? <ErrorState message={t("settings.signOutError")} /> : null}
      </ScrollView>
      {confirmation === "signOut" ? (
        <SignOutDialog onCancel={() => setConfirmation(null)} onConfirm={confirm} />
      ) : null}
      {confirmation !== null && confirmation !== "signOut" ? (
        <ConfirmationDialog
          confirmation={confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirm}
        />
      ) : null}
    </SafeAreaView>
  );
}

function useSignOutFlow(onSignOut: () => Promise<void>) {
  const [signingOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setSigningOut(true);
    setFailed(false);
    try {
      await onSignOut();
    } catch {
      setFailed(true);
    } finally {
      setSigningOut(false);
    }
  };

  return { failed, run, signingOut };
}

type PrivacyFeedbackProps = {
  isUpdating: boolean;
  update: ReturnType<typeof useSettings>["update"];
};

function PrivacyFeedback({ isUpdating, update }: Readonly<PrivacyFeedbackProps>) {
  const { t } = useTranslation();
  const acceptedRequests =
    update.isSuccess && !update.data.is_private ? update.data.accepted_requests : 0;

  return (
    <>
      {isUpdating ? <Loading label={t("settings.saving")} /> : null}
      {update.isError ? <ErrorState message={t("settings.updateError")} /> : null}
      {acceptedRequests > 0 ? (
        <AppText accessibilityLiveRegion="polite" style={styles.success}>
          {t("settings.accepted", { count: acceptedRequests })}
        </AppText>
      ) : null}
    </>
  );
}

type NavigationRowProps = {
  destination: Destination;
  disabled: boolean;
  icon: string;
  onPress: (destination: Destination) => void;
  support?: string;
};

function NavigationRow({
  destination,
  disabled,
  icon,
  onPress,
  support
}: Readonly<NavigationRowProps>) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onPress(destination)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon color={colors.primary[500]} size={22} source={icon} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.label}>{t(`settings.${destination}`)}</AppText>
        {support ? <AppText style={styles.support}>{support}</AppText> : null}
      </View>
      <Icon color={colors.primary[500]} size={24} source="chevron-right" />
    </Pressable>
  );
}

type PrivacyRowProps = {
  busy: boolean;
  disabled: boolean;
  isPrivate: boolean;
  onChange: (value: boolean) => void;
};

function PrivacyRow({ busy, disabled, isPrivate, onChange }: Readonly<PrivacyRowProps>) {
  const { t } = useTranslation();
  const support = t(isPrivate ? "settings.privateSupport" : "settings.publicSupport");

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Icon color={colors.primary[500]} size={22} source="lock-outline" />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.label}>{t("settings.privateAccount")}</AppText>
        <AppText style={styles.support}>{support}</AppText>
      </View>
      <Switch
        accessibilityState={{ checked: isPrivate, disabled, busy }}
        accessibilityLabel={t("settings.privateAccount")}
        accessibilityHint={support}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colors.neutrals[600], true: colors.primary[700] }}
        thumbColor={colors.neutrals[100]}
        value={isPrivate}
      />
    </View>
  );
}

type ConfirmationDialogProps = {
  confirmation: Confirmation;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmationDialog({
  confirmation,
  onCancel,
  onConfirm
}: Readonly<ConfirmationDialogProps>) {
  const { t } = useTranslation();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <Icon color={colors.primary[500]} size={32} source={CONFIRMATION_ICONS[confirmation]} />
          <AppText style={styles.title}>{t(`settings.confirm.${confirmation}.title`)}</AppText>
          <AppText style={styles.message}>{t(`settings.confirm.${confirmation}.message`)}</AppText>
          <Button label={t("settings.confirmAction")} onPress={onConfirm} />
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}>
            <AppText style={styles.label}>{t("settings.cancel")}</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
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
