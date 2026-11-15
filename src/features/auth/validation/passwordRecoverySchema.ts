import { z } from "zod";

import { i18n } from "@/i18n";

import { emailSchema, passwordSchema } from "./signUpSchema";

export const passwordRecoverySchema = z
  .object({
    email: emailSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: () => i18n.t("auth.validation.passwordMismatch"),
    path: ["confirmPassword"]
  });

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;
