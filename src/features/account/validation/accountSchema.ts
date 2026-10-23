import { z } from "zod";

import {
  emailSchema,
  MIN_PASSWORD_LENGTH,
  usernameSchema
} from "@/features/auth/validation/signUpSchema";
import { i18n } from "@/i18n";

// No route returns the email yet, so an account without one can still save other fields.
const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || emailSchema.safeParse(value).success, {
    error: () => i18n.t("auth.validation.emailInvalid")
  });

export const createAccountSchema = (requireEmail: boolean) =>
  z
    .object({
      confirmPassword: z.string(),
      email: requireEmail ? emailSchema : optionalEmailSchema,
      name: z
        .string()
        .trim()
        .min(1, { error: () => i18n.t("auth.validation.nameRequired") }),
      newPassword: z.string(),
      username: usernameSchema
    })
    .superRefine(({ confirmPassword, newPassword }, context) => {
      if (!newPassword && !confirmPassword) {
        return;
      }

      if (!newPassword || !confirmPassword) {
        context.addIssue({
          code: "custom",
          message: i18n.t("account.passwordPairRequired"),
          path: [newPassword ? "confirmPassword" : "newPassword"]
        });
        return;
      }

      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        context.addIssue({
          code: "custom",
          message: i18n.t("auth.validation.passwordMinLength", { min: MIN_PASSWORD_LENGTH }),
          path: ["newPassword"]
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        context.addIssue({
          code: "custom",
          message: i18n.t("auth.validation.passwordMismatch"),
          path: ["confirmPassword"]
        });
      }
    });

export type AccountFormValues = z.input<ReturnType<typeof createAccountSchema>>;
