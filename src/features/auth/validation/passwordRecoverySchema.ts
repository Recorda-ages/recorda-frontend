import { z } from "zod";

export const passwordRecoverySchema = z.object({
  email: z.string().min(1, "Informe seu email.").email("Informe um email valido.")
});

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;
