import { z } from 'zod';

export const SendVerificationCodeSchema = z.object({
    email: z.email('Por favor, insira um e-mail válido.')
})

export const VerifyCodeSchema = z.object({
    email: z.email('Por favor insira um e-mail válido.'),
    code: z.string().length(6, 'O código deve ter 6 dígitos!')
})

export const CompleteRegistrationSchema = z.object({
    username: z.string().min(3, 'Seu nome de usuário deve conter ao menos 3 caracteres.'),
    password: z.string()
                .min(8, 'Sua senha deve ter ao menos 8 dígitos')
                .regex(/[A-Z]/, "Sua senha deve conter ao menos uma letra maiúscula.")
                .regex(/[a-z]/, "Sua senha deve conter ao menos uma letra minúscula.")
                .regex(/[0-9]/, "Sua senha deve conter ao menos um número.")
                .regex(/[^A-Za-z0-9]/, "Sua senha deve conter ao menos um caractere especial.")
})

export const LoginUserSchema = z.object({
    email: z.email('Por favor insira um e-mail válido.'),
    password: z.string().min(1, 'A senha é obrigatória.')
});

export type SendVerificationCode = z.Infer<typeof SendVerificationCodeSchema>
export type VerifyCode = z.Infer<typeof VerifyCodeSchema>
export type CompleteRegistration = z.Infer<typeof CompleteRegistrationSchema>
export type LoginUser = z.Infer<typeof LoginUserSchema>