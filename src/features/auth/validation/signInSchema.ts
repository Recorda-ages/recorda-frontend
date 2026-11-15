import { z } from "zod";

import { i18n } from "@/i18n";

export const signInSchema = z.object({
  password: z.string().min(1, { error: () => i18n.t("auth.validation.passwordRequired") }),
  username: z
    .string()
    .trim()
    .min(1, { error: () => i18n.t("auth.validation.usernameRequired") })
});

export type SignInFormValues = z.infer<typeof signInSchema>;
