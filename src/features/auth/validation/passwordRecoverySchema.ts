import { z } from "zod";

export const passwordRecoverySchema = z
  .object({
    email: z.string().trim().min(1, "Informe seu email.").email("Informe um email válido."),
    newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.")
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "As senhas devem ser idênticas.",
    path: ["confirmPassword"]
  });

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;
