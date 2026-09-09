import { z } from "zod";

const usernameSchema = z.string().superRefine((value, context) => {
  if (value.trim().length === 0) {
    context.addIssue({
      code: "custom",
      message: "Informe seu usuário."
    });
    return;
  }

  if (/\s/.test(value)) {
    context.addIssue({
      code: "custom",
      message: "O usuário não pode conter espaços."
    });
  }
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome."),
  username: usernameSchema,
  email: z.string().trim().min(1, "Informe seu email.").email("Informe um email válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres.")
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;
