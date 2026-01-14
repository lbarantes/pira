import { z } from 'zod';

export const ChatMessageSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  username: z.string().min(1, { message: 'Identifique-se' }).max(50, { message: 'Nome grande da porra' }),
  message: z.string().min(1, { message: 'A mensagem não pode ser vazia' }).max(2000, { message: 'Mensagem muito longa' }),
  groupId: z.string().uuid(),
  channelId: z.string().uuid(),
  timestamp: z.number().optional(),
  userAvatar: z.string().optional()
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

