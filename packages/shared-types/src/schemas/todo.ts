import { z } from 'zod';

export const CreateTodoSchema = z.object({
  title: z.string().min(1, { message: 'O título é obrigatório!' }).max(100, { message: 'O título é muito longo!' }),
});

export const TodoSchema = CreateTodoSchema.extend({
  id: z.string(),
  completed: z.boolean()
});

export const UpdateTodoSchema = CreateTodoSchema.extend({
  completed: z.boolean()
}).partial();

export type Todo = z.Infer<typeof TodoSchema>;
export type CreateTodo = z.Infer<typeof CreateTodoSchema>;
export type UpdateTodo = z.Infer<typeof UpdateTodoSchema>;
