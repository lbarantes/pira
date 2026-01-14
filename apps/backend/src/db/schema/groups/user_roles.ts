import { pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { groups } from "./groups";
import { users } from "../users";
import { groupRoles } from "./roles";

export const user_groups_roles = pgTable('user_groups_roles', {
    user_id: uuid('user_id').notNull().references(() => users.id),
    group_id: uuid('group_id').notNull().references(() => groups.id),
    role_id: uuid('role_id').notNull().references(() => groupRoles.id),
});

export const userGroupsRolesRelations = relations(user_groups_roles, ({ one }) => ({
    user: one(users, {
        fields: [user_groups_roles.user_id],
        references: [users.id],
    }),
    group: one(groups, {
        fields: [user_groups_roles.group_id],
        references: [groups.id],
    }),
    role: one(groupRoles, {
        fields: [user_groups_roles.role_id],
        references: [groupRoles.id],
    }),
}));