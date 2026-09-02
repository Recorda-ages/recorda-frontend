import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { usePasswordRecoveryMutation } from "@/features/auth/hooks/usePasswordRecoveryMutation";
import {
  type PasswordRecoveryFormValues,
  passwordRecoverySchema
} from "@/features/auth/validation/passwordRecoverySchema";
import { baseColors, colors, fontFamily, fontWeight, radius, spacing } from "@/theme";
import { zodResolver } from "@/utils/validation";

type PasswordRecoveryScreenProps = NativeStackScreenProps<RootStackParamList, "PasswordRecovery">;

const successRedirectDelayMs = 1200;

export function PasswordRecoveryScreen({ navigation }: PasswordRecoveryScreenProps) {
  const { t } = useTranslation();
  const passwordRecoveryMutation = usePasswordRecoveryMutation();
  const [feedback, setFeedback] = useState<"error" | "success" | null>(null);
  const {
    control,
    formState: { errors, isValid },
    handleSubmit
  } = useForm<PasswordRecoveryFormValues>({
    defaultValues: {
      email: ""
    },
    mode: "all",
    resolver: zodResolver(passwordRecoverySchema)
  });

  useEffect(() => {
    if (feedback !== "success") {
      return undefined;
    }

    const timeout = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }]
      });
    }, successRedirectDelayMs);

    return () => clearTimeout(timeout);
  }, [feedback, navigation]);

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null);

    try {
      await passwordRecoveryMutation.mutateAsync({ email: values.email });
      setFeedback("success");
    } catch {
      setFeedback("error");
    }
  });

  return (
    <View style={styles.screen} testID="password-recovery-screen">
      <StatusBar style="light" />
      <View style={styles.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.appBar}>
          <Pressable
            accessibilityLabel={t("auth.passwordRecovery.back")}
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.backIcon}
            />
          </Pressable>
          <AppText style={styles.appBarTitle} variant="headline4">
            {t("auth.passwordRecovery.appBarTitle")}
          </AppText>
          <View style={styles.appBarSpacer} />
        </View>

        <View style={styles.header}>
          <AppText style={styles.logo} variant="title">
            {t("auth.passwordRecovery.logo")}
          </AppText>
          <AppText style={styles.title} variant="headline1">
            {t("auth.passwordRecovery.title")}
          </AppText>
          <AppText style={styles.description} variant="body1">
            {t("auth.passwordRecovery.description")}
          </AppText>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <View>
                <View style={[styles.emailInputFrame, errors.email ? styles.inputError : null]}>
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={styles.emailIcon}
                  >
                    <View style={styles.emailIconFlapLeft} />
                    <View style={styles.emailIconFlapRight} />
                  </View>
                  <TextInput
                    accessibilityHint={errors.email ? errors.email.message : undefined}
                    accessibilityLabel={t("auth.passwordRecovery.email")}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder={t("auth.passwordRecovery.email")}
                    placeholderTextColor={colors.primary[100]}
                    style={styles.emailInput}
                    textContentType="emailAddress"
                    value={value}
                  />
                </View>
                {errors.email ? (
                  <AppText style={styles.fieldError} variant="caption">
                    {errors.email.message}
                  </AppText>
                ) : null}
              </View>
            )}
          />

          {feedback === "success" ? (
            <AppText accessibilityLiveRegion="polite" style={styles.success} variant="body2">
              {t("auth.passwordRecovery.success")}
            </AppText>
          ) : null}

          {feedback === "error" ? (
            <AppText accessibilityLiveRegion="polite" style={styles.formError} variant="body2">
              {t("auth.passwordRecovery.genericError")}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              busy: passwordRecoveryMutation.isPending,
              disabled: !isValid || passwordRecoveryMutation.isPending
            }}
            disabled={!isValid || passwordRecoveryMutation.isPending}
            onPress={onSubmit}
            style={[
              styles.submitButton,
              !isValid || passwordRecoveryMutation.isPending ? styles.submitButtonDisabled : null
            ]}
          >
            <AppText style={styles.submitButtonLabel} variant="buttonLarge">
              {t("auth.passwordRecovery.submit")}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  appBarSpacer: {
    width: 48
  },
  appBarTitle: {
    color: baseColors.white,
    fontFamily: fontFamily.primary.bold,
    fontWeight: fontWeight.bold
  },
  backButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  backIcon: {
    borderBottomWidth: 4,
    borderColor: baseColors.white,
    borderLeftWidth: 4,
    height: 18,
    transform: [{ rotate: "45deg" }],
    width: 18
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.neutrals[900],
    experimental_backgroundImage:
      "radial-gradient(circle at 18% 45%, rgba(0, 226, 169, 0.42) 0%, rgba(0, 226, 169, 0.18) 28%, rgba(21, 21, 21, 0) 58%), radial-gradient(circle at 82% 88%, rgba(0, 226, 169, 0.38) 0%, rgba(0, 226, 169, 0.12) 30%, rgba(21, 21, 21, 0) 62%)"
  },
  content: {
    flexGrow: 1,
    gap: spacing[10],
    paddingHorizontal: spacing[8],
    paddingTop: spacing[10],
    paddingVertical: spacing[12]
  },
  description: {
    color: colors.neutrals[100],
    fontSize: 20,
    lineHeight: 30,
    maxWidth: 330
  },
  emailIcon: {
    borderColor: colors.primary[100],
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 18,
    overflow: "hidden",
    width: 24
  },
  emailIconFlapLeft: {
    borderColor: colors.primary[100],
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 17,
    left: 1,
    position: "absolute",
    top: -8,
    transform: [{ rotate: "45deg" }],
    width: 17
  },
  emailIconFlapRight: {
    borderColor: colors.primary[100],
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 17,
    position: "absolute",
    right: 1,
    top: -8,
    transform: [{ rotate: "135deg" }],
    width: 17
  },
  emailInput: {
    color: colors.primary[100],
    flex: 1,
    fontFamily: fontFamily.primary.regular,
    fontSize: 20,
    minHeight: 64,
    paddingVertical: spacing[2]
  },
  emailInputFrame: {
    alignItems: "center",
    backgroundColor: "rgba(41, 41, 41, 0.92)",
    borderColor: colors.primary[100],
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: spacing[4],
    minHeight: 68,
    paddingHorizontal: spacing[5],
    width: "100%"
  },
  form: {
    gap: spacing[10],
    width: "100%"
  },
  formError: {
    color: colors.error[200],
    fontFamily: fontFamily.primary.semiBold,
    fontWeight: fontWeight.semiBold
  },
  fieldError: {
    color: colors.error[200],
    paddingTop: spacing[2]
  },
  header: {
    gap: spacing[3],
    paddingTop: spacing[5]
  },
  inputError: {
    borderColor: colors.error[200]
  },
  logo: {
    color: colors.primary[500],
    fontFamily: fontFamily.display.bold,
    fontSize: 38,
    fontStyle: "italic",
    fontWeight: fontWeight.bold
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderCurve: "continuous",
    borderRadius: 36,
    justifyContent: "center",
    minHeight: 72,
    width: "100%"
  },
  submitButtonDisabled: {
    opacity: 0.56
  },
  submitButtonLabel: {
    color: colors.neutrals[900],
    fontFamily: fontFamily.primary.bold,
    fontSize: 20,
    fontWeight: fontWeight.bold
  },
  success: {
    color: colors.primary[100],
    fontFamily: fontFamily.primary.semiBold,
    fontWeight: fontWeight.semiBold
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 40,
    fontWeight: fontWeight.bold
  }
});
