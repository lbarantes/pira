import { boolean, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { groups } from "./groups";

export const groupRoles = pgTable('group_roles', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    group_id: uuid('group_id').notNull().references(() => groups.id),
    role_name: varchar('role_name').notNull(),
    role_color: varchar('role_color').notNull(),
});

export const groupRolesRelations = relations(groupRoles, ({ one, many }) => ({
    group: one(groups, {
        fields: [groupRoles.group_id],
        references: [groups.id],
    }),
    permissions: many(groupRolePermissions),
}));

export const groupRolePermissions = pgTable('group_role_permissions', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    group_id: uuid('group_id').notNull().references(() => groups.id),
    role_id: uuid('role_id').notNull().references(() => groupRoles.id),
    is_admin: boolean('is_admin').notNull().default(false),

    // Permissões de gerenciamento do grupo
    group_can_manage_roles: boolean('group_can_manage_roles').notNull().default(false),
    group_can_view_channels: boolean('group_can_view_channels').notNull().default(false),
    group_can_manage_channels: boolean('group_can_manage_channels').notNull().default(false),

    // Permissões relacionadas à membros
    members_can_invite: boolean('members_can_invite').notNull().default(false),
    members_can_kick: boolean('members_can_kick').notNull().default(false),
    members_can_ban: boolean('members_can_ban').notNull().default(false),

    // Permissões de chats - serão aplicadas pra todos chats sem configurações especificas
    chat_can_send_messages: boolean('chat_can_send_messages').notNull().default(false),
    chat_can_send_links: boolean('chat_can_send_links').notNull().default(false),
    chat_can_send_files: boolean('chat_can_send_files').notNull().default(false),
    chat_can_manage_messages: boolean('chat_can_manage_messages').notNull().default(false),
    chat_can_fix_messages: boolean('chat_can_fix_messages').notNull().default(false),
    chat_can_view_history: boolean('chat_can_view_history').notNull().default(false),
});

export const groupRolePermissionsRelations = relations(groupRolePermissions, ({ one }) => ({
    group: one(groups, {
        fields: [groupRolePermissions.group_id],
        references: [groups.id],
    }),
    role: one(groupRoles, {
        fields: [groupRolePermissions.role_id],
        references: [groupRoles.id],
    }),
}));