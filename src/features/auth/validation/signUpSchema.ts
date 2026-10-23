import { z } from "zod";

import { i18n } from "@/i18n";

export const MIN_PASSWORD_LENGTH = 8;

export const usernameSchema = z.string().superRefine((value, context) => {
  if (value.trim().length === 0) {
    context.addIssue({
      code: "custom",
      message: i18n.t("auth.validation.usernameRequired")
    });
    return;
  }

  if (/\s/.test(value)) {
    context.addIssue({
      code: "custom",
      message: i18n.t("auth.validation.usernameNoSpaces")
    });
  }
});

export const emailSchema = z
  .string()
  .trim()
  .min(1, { error: () => i18n.t("auth.validation.emailRequired") })
  .email({ error: () => i18n.t("auth.validation.emailInvalid") });

export const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH, {
  error: () => i18n.t("auth.validation.passwordMinLength", { min: MIN_PASSWORD_LENGTH })
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => i18n.t("auth.validation.nameRequired") }),
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
