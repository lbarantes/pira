import { pgEnum, pgTable, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "../users";
import { groups } from "./groups";

export const inviteExpirationEnum = pgEnum('invite_expiration_enum', [
    '30_minutes',
    '1_hour',
    '6_hours',
    '12_hours',
    '1_day',
    '7_days'
]);

export const inviteUsesEnum = pgEnum('invite_uses_enum', [
    'unlimited',
    '1_use',
    '5_uses',
    '10_uses',
    '25_uses',
    '50_uses',
    '100_uses'
]);

export const groupInvites = pgTable('group_invites', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    group_id: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    created_by: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 256 }).notNull().unique(),
    
    // Configurações de expiração
    expires_at: timestamp('expires_at').notNull(),
    expiration_type: inviteExpirationEnum('expiration_type').notNull(),
    
    // Configurações de usos
    max_uses: integer('max_uses'), // null = ilimitado
    uses_count: integer('uses_count').default(0).notNull(),
    uses_type: inviteUsesEnum('uses_type').notNull(),
    
    // Status
    is_active: integer('is_active').default(1).notNull(), // 1 = ativo, 0 = desativado
    
    // Timestamps
    created_at: timestamp('created_at').notNull().$defaultFn(() => new Date()),
    updated_at: timestamp('updated_at').notNull().$defaultFn(() => new Date()),
});

export const groupInvitesRelations = relations(groupInvites, ({ one }) => ({
    group: one(groups, {
        fields: [groupInvites.group_id],
        references: [groups.id],
    }),
    creator: one(users, {
        fields: [groupInvites.created_by],
        references: [users.id],
    }),
}));