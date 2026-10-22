import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Input, Loading, useToast } from "@/components/ui";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/validation/signUpSchema";
import { ApiError } from "@/services/api";
import { colors, fontFamily, spacing, withOpacity } from "@/theme";

import { DeleteAccountDialog } from "../components/DeleteAccountDialog";
import { isSessionError, useAccount } from "../hooks/useAccount";
import { useDeleteAccount } from "../hooks/useDeleteAccount";
import { useLeaveToLogin } from "../hooks/useLeaveToLogin";
import { useUpdateAccount } from "../hooks/useUpdateAccount";
import type { Account, AccountChanges } from "../types";
import { type AccountFormValues, accountSchema } from "../validation/accountSchema";

type AccountField = keyof AccountFormValues;

const API_FIELDS: Record<string, AccountField> = {
  email: "email",
  name: "name",
  password: "newPassword",
  username: "username"
};

function toFormValues(account: Account): AccountFormValues {
  return {
    confirmPassword: "",
    email: account.email,
    name: account.name,
    newPassword: "",
    username: account.username
  };
}

function getChanges(account: Account, values: AccountFormValues): AccountChanges | null {
  const changes: AccountChanges = {};
  const name = values.name.trim();
  const username = values.username.trim();
  const email = values.email.trim();

  if (name !== account.name) changes.name = name;
  if (username !== account.username) changes.username = username;
  if (email !== account.email) changes.email = email;
  if (values.newPassword) changes.password = values.newPassword;

  return Object.keys(changes).length > 0 ? changes : null;
}

function getFieldErrors(error: unknown): { field: AccountField; status: number }[] {
  if (!(error instanceof ApiError) || (error.status !== 409 && error.status !== 422)) {
    return [];
  }

  const fields = (error.details as { fields?: unknown } | null)?.fields;

  if (!Array.isArray(fields)) {
    return [];
  }

  return fields.flatMap((item: { field?: string }) => {
    const field = item.field ? API_FIELDS[item.field] : undefined;
    return field ? [{ field, status: error.status }] : [];
  });
}

export function AccountScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const account = useAccount();
  const leaveToLogin = useLeaveToLogin();
  const sessionLost = isSessionError(account.error);

  useEffect(() => {
    if (sessionLost) {
      void leaveToLogin(t("account.sessionExpired"));
    }
  }, [leaveToLogin, sessionLost, t]);

  const renderContent = () => {
    if (account.data) {
      return <AccountForm account={account.data} />;
    }

    if (account.isError && !sessionLost) {
      return (
        <View style={styles.feedback}>
          <ErrorState message={t("account.loadError")} />
          <Button
            label={t("account.retry")}
            onPress={() => void account.refetch()}
            variant="secondary"
          />
        </View>
      );
    }

    return <Loading label={t("account.loading")} />;
  };

  return (
    <View style={styles.screen} testID="account-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top", "bottom"]} style={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t("account.back")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            testID="account-back"
          >
            <Icon color={colors.neutrals[100]} size={28} source="chevron-left" />
          </Pressable>
          <AppText style={styles.title}>{t("account.title")}</AppText>
          <View style={styles.headerSpacer} />
        </View>
        {renderContent()}
      </SafeAreaView>
    </View>
  );
}

function AccountForm({ account }: Readonly<{ account: Account }>) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const leaveToLogin = useLeaveToLogin();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty }
  } = useForm<AccountFormValues>({
    defaultValues: toFormValues(account),
    mode: "onBlur",
    resolver: zodResolver(accountSchema)
  });

  const fieldMessage = (field: AccountField, status: number) => {
    if (status === 409 && field === "username") return t("account.usernameTaken");
    if (status === 409 && field === "email") return t("account.emailTaken");
    if (field === "email") return t("auth.validation.emailInvalid");
    if (field === "newPassword") {
      return t("auth.validation.passwordMinLength", { min: MIN_PASSWORD_LENGTH });
    }
    return t("account.invalidField");
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const changes = getChanges(account, values);

    if (!changes) {
      showToast(t("account.noChanges"));
      return;
    }

    try {
      const updated = await updateAccount.mutateAsync(changes);
      reset(toFormValues(updated));
      showToast(t("account.saveSuccess"));
    } catch (error) {
      if (isSessionError(error)) {
        await leaveToLogin(t("account.sessionExpired"));
        return;
      }

      const fieldErrors = getFieldErrors(error);

      if (fieldErrors.length > 0) {
        fieldErrors.forEach(({ field, status }) =>
          setError(field, { message: fieldMessage(field, status) })
        );
        return;
      }

      setFormError(t("account.saveError"));
    }
  });

  const openDeleteDialog = () => {
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteError(null);

    try {
      await deleteAccount.mutateAsync();
      setIsDeleteOpen(false);
      await leaveToLogin(t("account.deleteSuccess"));
    } catch (error) {
      if (isSessionError(error)) {
        setIsDeleteOpen(false);
        await leaveToLogin(t("account.sessionExpired"));
        return;
      }

      setDeleteError(t("account.deleteDialog.error"));
    }
  };

  const isSaving = updateAccount.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.content}
    >
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.sectionTitle}>{t("account.infoSection")}</AppText>

        <Controller
          control={control}
          name="name"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              accessibilityHint={errors.name?.message}
              accessibilityLabel={t("account.name")}
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name?.message}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t("account.name")}
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.inputText}
              testID="account-name"
              textContentType="name"
              value={value}
              variant="dark"
            />
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              accessibilityHint={errors.username?.message}
              accessibilityLabel={t("account.username")}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username?.message}
              leftAccessory={
                <Icon color={colors.primary[200]} size={22} source="account-circle-outline" />
              }
              onBlur={onBlur}
              onChangeText={(text) => onChange(text.replace(/^@+/, ""))}
              placeholder={t("account.username")}
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.inputText}
              testID="account-username"
              textContentType="username"
              value={value ? `@${value}` : ""}
              variant="dark"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              accessibilityHint={errors.email?.message}
              accessibilityLabel={t("account.email")}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={errors.email?.message}
              keyboardType="email-address"
              leftAccessory={<Icon color={colors.primary[200]} size={22} source="email-outline" />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t("account.email")}
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.inputText}
              testID="account-email"
              textContentType="emailAddress"
              value={value}
              variant="dark"
            />
          )}
        />

        <View style={styles.divider} />

        <AppText style={styles.sectionTitle}>{t("account.passwordSection")}</AppText>

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              accessibilityHint={errors.newPassword?.message}
              accessibilityLabel={t("account.newPassword")}
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              error={errors.newPassword?.message}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t("account.newPassword")}
              placeholderTextColor={PLACEHOLDER_COLOR}
              secureTextEntry
              style={styles.inputText}
              testID="account-new-password"
              textContentType="newPassword"
              value={value}
              variant="dark"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              accessibilityHint={errors.confirmPassword?.message}
              accessibilityLabel={t("account.confirmPassword")}
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              error={errors.confirmPassword?.message}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t("account.confirmPassword")}
              placeholderTextColor={PLACEHOLDER_COLOR}
              secureTextEntry
              style={styles.inputText}
              testID="account-confirm-password"
              textContentType="newPassword"
              value={value}
              variant="dark"
            />
          )}
        />

        <View style={styles.divider} />

        <Pressable
          accessibilityLabel={t("account.deleteAccount")}
          accessibilityRole="button"
          onPress={openDeleteDialog}
          style={({ pressed }) => [styles.deleteRow, pressed ? styles.pressed : null]}
          testID="account-delete-button"
        >
          <Icon color={colors.error[300]} size={22} source="trash-can" />
          <AppText style={styles.deleteLabel}>{t("account.deleteAccount")}</AppText>
          <Icon color={colors.error[300]} size={22} source="chevron-right" />
        </Pressable>

        {formError ? (
          <AppText accessibilityRole="alert" style={styles.formError}>
            {formError}
          </AppText>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityLabel={t("account.save")}
          accessibilityRole="button"
          accessibilityState={{ busy: isSaving, disabled: !isDirty || isSaving }}
          disabled={!isDirty || isSaving}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.saveButton,
            !isDirty || isSaving ? styles.saveButtonDisabled : null,
            pressed ? styles.pressed : null
          ]}
          testID="account-save-button"
        >
          {isSaving ? (
            <ActivityIndicator color={colors.neutrals[900]} size="small" />
          ) : (
            <AppText style={styles.saveLabel} variant="buttonLarge">
              {t("account.save")}
            </AppText>
          )}
        </Pressable>
      </View>

      <DeleteAccountDialog
        deleting={deleteAccount.isPending}
        error={deleteError}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        visible={isDeleteOpen}
      />
    </KeyboardAvoidingView>
  );
}

const PLACEHOLDER_COLOR = withOpacity(colors.primary[200], 0.7);

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  deleteLabel: {
    color: colors.error[300],
    flex: 1,
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 16
  },
  deleteRow: {
    alignItems: "center",
    backgroundColor: withOpacity(colors.error[300], 0.12),
    borderColor: colors.error[300],
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: spacing[4],
    minHeight: 56,
    paddingHorizontal: spacing[5]
  },
  divider: {
    backgroundColor: colors.neutrals[700],
    height: 1,
    marginVertical: spacing[1]
  },
  feedback: {
    gap: spacing[3],
    padding: spacing[4]
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4]
  },
  form: {
    gap: spacing[4],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4]
  },
  formError: {
    color: colors.error[200],
    textAlign: "center"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4]
  },
  headerSpacer: {
    width: 28
  },
  inputText: {
    color: colors.primary[200]
  },
  pressed: {
    opacity: 0.82
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: 28,
    justifyContent: "center",
    minHeight: 56,
    width: "100%"
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveLabel: {
    color: colors.neutrals[900],
    fontFamily: fontFamily.primary.bold
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  sectionTitle: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 14
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 20,
    textAlign: "center"
  }
});
