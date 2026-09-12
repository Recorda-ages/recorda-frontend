import { z } from "zod";

export const signInSchema = z.object({
  password: z.string().min(1, "Informe sua senha."),
  username: z.string().trim().min(1, "Informe seu usuário.")
});

export type SignInFormValues = z.infer<typeof signInSchema>;