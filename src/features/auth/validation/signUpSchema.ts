import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome."),
  username: z
    .string()
    .trim()
    .min(1, "Informe seu usuário.")
    .regex(/^\S+$/, "O usuário não pode conter espaços."),
  email: z.string().trim().min(1, "Informe seu email.").email("Informe um email válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.")
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
