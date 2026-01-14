import { z } from 'zod';

export const InviteExpirationEnum = z.enum([
    '30_minutes',
    '1_hour',
    '6_hours',
    '12_hours',
    '1_day',
    '7_days'
]);

export const InviteUsesEnum = z.enum([
    'unlimited',
    '1_use',
    '5_uses',
    '10_uses',
    '25_uses',
    '50_uses',
    '100_uses'
]);

export const GroupInviteSchema = z.object({
    id: z.string().uuid(),
    group_id: z.string().uuid(),
    created_by: z.string().uuid(),
    token: z.string(),
    expires_at: z.date(),
    expiration_type: InviteExpirationEnum,
    max_uses: z.number().nullable(),
    uses_count: z.number(),
    uses_type: InviteUsesEnum,
    is_active: z.number(),
    created_at: z.date(),
    updated_at: z.date(),
});

export const CreateGroupInviteSchema = z.object({
    expiration_type: InviteExpirationEnum.default('7_days'),
    uses_type: InviteUsesEnum.default('unlimited'),
});

export const GroupInviteWithGroupSchema = GroupInviteSchema.extend({
    group: z.object({
        id: z.string().uuid(),
        group_name: z.string(),
        group_description: z.string(),
        group_avatar: z.string(),
    }),
});

export type GroupInvite = z.infer<typeof GroupInviteSchema>;
export type CreateGroupInvite = z.infer<typeof CreateGroupInviteSchema>;
export type GroupInviteWithGroup = z.infer<typeof GroupInviteWithGroupSchema>;
