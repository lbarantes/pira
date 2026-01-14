import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "../users";

export const groupStatusEnum = pgEnum('group_status_enum', ['active', 'inactive', 'archived']);

export const groups = pgTable('groups', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    group_name: varchar('group_name', { length: 100 }).notNull(),
    group_description: varchar('group_description', { length: 1000 }).notNull(),
    group_avatar: varchar('group_avatar').notNull(),
    group_owner: uuid('group_owner').notNull().references(() => users.id),
    group_status: groupStatusEnum('group_status').default('active').notNull(),
    created_at: timestamp('created_at').notNull().$defaultFn(() => new Date()),
    updated_at: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});