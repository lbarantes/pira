import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { groups } from "../groups/groups";

export const channels = pgTable('channels', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    group_id: uuid('group_id').notNull().references(() => groups.id),
    channel_name: varchar('channel_name', { length: 100 }).notNull(),
    channel_description: varchar('channel_description', { length: 1000 }).notNull(),
    position: integer('position').notNull().default(0),
    created_at: timestamp('created_at').notNull().$defaultFn(() => new Date()),
    updated_at: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});