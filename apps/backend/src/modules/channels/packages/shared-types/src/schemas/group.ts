import { z } from 'zod';

// ===== ENUMS =====
export const GroupStatusEnum = z.enum(['active', 'inactive', 'archived']);
export type GroupStatus = z.infer<typeof GroupStatusEnum>;

// ===== GROUPS =====
export const GroupSchema = z.object({
    id: z.uuid(),
    group_name: z.string().max(100),
    group_description: z.string().max(1000),
    group_avatar: z.url(),
    group_owner: z.uuid(),
    group_status: GroupStatusEnum,
    created_at: z.date(),
    updated_at: z.date(),
});

export type Group = z.infer<typeof GroupSchema>;

export const CreateGroupSchema = z.object({
    group_name: z.string().min(1, 'Nome do grupo é obrigatório').max(100),
    group_description: z.string().max(1000),
    group_avatar: z.string().url('Avatar deve ser uma URL válida'),
});

export type CreateGroup = z.infer<typeof CreateGroupSchema>;

export const UpdateGroupSchema = z.object({
    group_name: z.string().min(1).max(100).optional(),
    group_description: z.string().max(1000).optional(),
    group_avatar: z.url().optional(),
    group_status: GroupStatusEnum.optional(),
});

export type UpdateGroup = z.infer<typeof UpdateGroupSchema>;

// ===== GROUP ROLES =====
export const GroupRoleSchema = z.object({
    id: z.uuid(),
    group_id: z.uuid(),
    role_name: z.string(),
    role_color: z.string(),
});

export type GroupRole = z.infer<typeof GroupRoleSchema>;

export const CreateGroupRoleSchema = z.object({
    role_name: z.string().min(1, 'Nome da função é obrigatório'),
    role_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser um código HEX válido'),
});

export type CreateGroupRole = z.infer<typeof CreateGroupRoleSchema>;

// ===== GROUP ROLE PERMISSIONS =====
export const GroupRolePermissionsSchema = z.object({
    id: z.uuid(),
    group_id: z.uuid(),
    role_id: z.uuid(),
    is_admin: z.boolean(),
    group_can_manage_roles: z.boolean(),
    group_can_view_channels: z.boolean(),
    group_can_manage_channels: z.boolean(),
    members_can_invite: z.boolean(),
    members_can_kick: z.boolean(),
    members_can_ban: z.boolean(),
    chat_can_send_messages: z.boolean(),
    chat_can_send_links: z.boolean(),
    chat_can_send_files: z.boolean(),
    chat_can_manage_messages: z.boolean(),
    chat_can_fix_messages: z.boolean(),
    chat_can_view_history: z.boolean(),
});

export type GroupRolePermissions = z.infer<typeof GroupRolePermissionsSchema>;

export const UpdateGroupRolePermissionsSchema = z.object({
    is_admin: z.boolean().optional(),
    group_can_manage_roles: z.boolean().optional(),
    group_can_view_channels: z.boolean().optional(),
    group_can_manage_channels: z.boolean().optional(),
    members_can_invite: z.boolean().optional(),
    members_can_kick: z.boolean().optional(),
    members_can_ban: z.boolean().optional(),
    chat_can_send_messages: z.boolean().optional(),
    chat_can_send_links: z.boolean().optional(),
    chat_can_send_files: z.boolean().optional(),
    chat_can_manage_messages: z.boolean().optional(),
    chat_can_fix_messages: z.boolean().optional(),
    chat_can_view_history: z.boolean().optional(),
});

export type UpdateGroupRolePermissions = z.infer<typeof UpdateGroupRolePermissionsSchema>;

// ===== USER GROUPS =====
export const UserGroupSchema = z.object({
    user_id: z.uuid(),
    group_id: z.uuid(),
    joined_at: z.date(),
});

export type UserGroup = z.infer<typeof UserGroupSchema>;

// ===== USER GROUP ROLES =====
export const UserGroupRoleSchema = z.object({
    user_id: z.uuid(),
    group_id: z.uuid(),
    role_id: z.uuid(),
});

export type UserGroupRole = z.infer<typeof UserGroupRoleSchema>;

export const AssignRoleToUserSchema = z.object({
    user_id: z.uuid(),
    role_id: z.uuid(),
});

export type AssignRoleToUser = z.infer<typeof AssignRoleToUserSchema>;
