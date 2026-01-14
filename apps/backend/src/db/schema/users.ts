import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    username: varchar('username', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull().unique(),
    passwordHash: text('password_hash').notNull()
})