import { z } from 'zod';

export const MessageSchema = z.object({
    id: z.uuidv7(),
    channel_id: z.uuid(),
    user_id: z.uuid(),
    content: z.string().max(2000),
    created_at: z.date(),
    updated_at: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageSchema = z.object({
    content: z.string().min(1, 'Mensagem não pode ser vazia').max(2000, 'Mensagem muito longa'),
});

export type CreateMessage = z.infer<typeof CreateMessageSchema>;

export const UpdateMessageSchema = z.object({
    content: z.string().min(1).max(2000),
});

export type UpdateMessage = z.infer<typeof UpdateMessageSchema>;
