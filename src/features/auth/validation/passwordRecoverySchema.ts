import { z } from "zod";

export const passwordRecoverySchema = z
  .object({
    email: z.string().min(1, "Informe seu email.").email("Informe um email valido."),
    newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua nova senha.")
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "As senhas devem ser identicas.",
    path: ["confirmPassword"]
  });

export type PasswordRecoveryFormValues = z.infer<typeof passwordRecoverySchema>;
