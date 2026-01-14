import { boolean, pgTable, uuid } from "drizzle-orm/pg-core";
import { users } from "../users";
import { groupRoles } from "../groups";
import { channels } from "./channels";

export const channelRolePermissions = pgTable('channel_role_permissions', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    channel_id: uuid('channel_id').notNull().references(() => channels.id),
    role_id: uuid('role_id').notNull().references(() => groupRoles.id),
    is_admin: boolean('is_admin').notNull().default(false), // Permissão GERAL

    // Permissões de gerenciamento do canal
    channel_can_view_channel: boolean('channel_can_view_channel').notNull().default(false),
    channel_can_manage_channel: boolean('channel_can_manage_channel').notNull().default(false),

    // Permissões de chats - serão aplicadas pra todos chats sem configurações especificas
    chat_can_send_messages: boolean('chat_can_send_messages').notNull().default(false),
    chat_can_send_links: boolean('chat_can_send_links').notNull().default(false),
    chat_can_send_files: boolean('chat_can_send_files').notNull().default(false),
    chat_can_manage_messages: boolean('chat_can_manage_messages').notNull().default(false),
    chat_can_fix_messages: boolean('chat_can_fix_messages').notNull().default(false),
    chat_can_view_history: boolean('chat_can_view_history').notNull().default(false),
});

export const channelUserPermissions = pgTable('channel_user_permissions', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    channel_id: uuid('channel_id').notNull().references(() => channels.id),
    user_id: uuid('user_id').notNull().references(() => users.id),
    is_admin: boolean('is_admin').notNull().default(false), // Permissão GERAL

    // Permissões de gerenciamento do canal
    channel_can_view_channel: boolean('channel_can_view_channel').notNull().default(false),
    channel_can_manage_channel: boolean('channel_can_manage_channel').notNull().default(false),

    // Permissões de chats - serão aplicadas pra todos chats sem configurações especificas
    chat_can_send_messages: boolean('chat_can_send_messages').notNull().default(false),
    chat_can_send_links: boolean('chat_can_send_links').notNull().default(false),
    chat_can_send_files: boolean('chat_can_send_files').notNull().default(false),
    chat_can_manage_messages: boolean('chat_can_manage_messages').notNull().default(false),
    chat_can_fix_messages: boolean('chat_can_fix_messages').notNull().default(false),
    chat_can_view_history: boolean('chat_can_view_history').notNull().default(false),
});