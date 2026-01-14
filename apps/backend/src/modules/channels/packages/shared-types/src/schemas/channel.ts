import { z } from 'zod';

export const ChannelSchema = z.object({
    id: z.uuid(),
    group_id: z.uuid(),
    channel_name: z.string().max(100),
    channel_description: z.string().max(1000),
    position: z.number().int(),
    created_at: z.date(),
    updated_at: z.date(),
});

export type Channel = z.infer<typeof ChannelSchema>;

export const CreateChannelSchema = z.object({
    channel_name: z.string().min(1, 'Nome do canal é obrigatório').max(100),
    channel_description: z.string().max(1000),
    position: z.number().int().default(0),
});

export type CreateChannel = z.infer<typeof CreateChannelSchema>;

export const UpdateChannelSchema = z.object({
    channel_name: z.string().min(1).max(100).optional(),
    channel_description: z.string().max(1000).optional(),
    position: z.number().int().optional(),
});

export type UpdateChannel = z.infer<typeof UpdateChannelSchema>;

// ===== CHANNEL ROLE PERMISSIONS =====
export const ChannelRolePermissionsSchema = z.object({
    id: z.uuid(),
    channel_id: z.uuid(),
    role_id: z.uuid(),
    is_admin: z.boolean(),
    channel_can_view_channel: z.boolean(),
    channel_can_manage_channel: z.boolean(),
    chat_can_send_messages: z.boolean(),
    chat_can_send_links: z.boolean(),
    chat_can_send_files: z.boolean(),
    chat_can_manage_messages: z.boolean(),
    chat_can_fix_messages: z.boolean(),
    chat_can_view_history: z.boolean(),
});

export type ChannelRolePermissions = z.infer<typeof ChannelRolePermissionsSchema>;

export const UpdateChannelRolePermissionsSchema = z.object({
    is_admin: z.boolean().optional(),
    channel_can_view_channel: z.boolean().optional(),
    channel_can_manage_channel: z.boolean().optional(),
    chat_can_send_messages: z.boolean().optional(),
    chat_can_send_links: z.boolean().optional(),
    chat_can_send_files: z.boolean().optional(),
    chat_can_manage_messages: z.boolean().optional(),
    chat_can_fix_messages: z.boolean().optional(),
    chat_can_view_history: z.boolean().optional(),
});

export type UpdateChannelRolePermissions = z.infer<typeof UpdateChannelRolePermissionsSchema>;

// ===== CHANNEL USER PERMISSIONS =====
export const ChannelUserPermissionsSchema = z.object({
    id: z.uuid(),
    channel_id: z.uuid(),
    user_id: z.uuid(),
    is_admin: z.boolean(),
    channel_can_view_channel: z.boolean(),
    channel_can_manage_channel: z.boolean(),
    chat_can_send_messages: z.boolean(),
    chat_can_send_links: z.boolean(),
    chat_can_send_files: z.boolean(),
    chat_can_manage_messages: z.boolean(),
    chat_can_fix_messages: z.boolean(),
    chat_can_view_history: z.boolean(),
});

export type ChannelUserPermissions = z.infer<typeof ChannelUserPermissionsSchema>;

export const UpdateChannelUserPermissionsSchema = z.object({
    is_admin: z.boolean().optional(),
    channel_can_view_channel: z.boolean().optional(),
    channel_can_manage_channel: z.boolean().optional(),
    chat_can_send_messages: z.boolean().optional(),
    chat_can_send_links: z.boolean().optional(),
    chat_can_send_files: z.boolean().optional(),
    chat_can_manage_messages: z.boolean().optional(),
    chat_can_fix_messages: z.boolean().optional(),
    chat_can_view_history: z.boolean().optional(),
});

export type UpdateChannelUserPermissions = z.infer<typeof UpdateChannelUserPermissionsSchema>;
