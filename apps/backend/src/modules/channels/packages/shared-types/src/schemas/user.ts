import { z } from "zod";

// ===== USER DATABASE =====
export const UserSchema = z.object({
    id: z.uuid(),
    username: z.string().max(256),
    email: z.email().max(256),
    passwordHash: z.string(),
});

export type User = z.infer<typeof UserSchema>;

// ===== USER PUBLIC (sem senha) =====
export const UserPublicSchema = z.object({
    id: z.uuid(),
    username: z.string().max(256),
    email: z.email().max(256),
});

export type UserPublic = z.infer<typeof UserPublicSchema>;

// ===== CREATE USER =====
export const CreateUserSchema = z.object({
    username: z.string().min(3, 'Nome de usuário deve ter ao menos 3 caracteres').max(256),
    email: z.string().email('Email inválido'),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

// ===== UPDATE USER =====
export const UpdateUserSchema = z.object({
    username: z.string().min(3).max(256).optional(),
    email: z.email().optional(),
});

export type UpdateUser = z.infer<typeof UpdateUserSchema>;