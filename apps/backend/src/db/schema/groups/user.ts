import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { groups } from "./groups";
import { users } from "../users";

export const user_groups = pgTable('user_groups', {
    user_id: uuid('user_id').notNull().references(() => users.id),
    group_id: uuid('group_id').notNull().references(() => groups.id),
    joined_at: timestamp('joined_at').notNull().$defaultFn(() => new Date()),
});

export const userGroupsRelations = relations(user_groups, ({ one }) => ({
    user: one(users, {
        fields: [user_groups.user_id],
        references: [users.id],
    }),
    group: one(groups, {
        fields: [user_groups.group_id],
        references: [groups.id],
    }),
}));