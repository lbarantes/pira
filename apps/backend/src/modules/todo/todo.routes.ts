import Elysia from 'elysia'
import * as todoService from './todo.service'
import { CreateTodoSchema, UpdateTodoSchema } from 'shared-types';

export const todoRoutes = new Elysia({ prefix: '/todos' })
  .get('/', () => todoService.getAll())
  .post('/', async ({ body, set }) => {
    const newTodo = await todoService.create(body);
    set.status = 201;
    return newTodo;
  },
  {
    body: CreateTodoSchema
  })
  .patch('/:id', async ({ params, body }) => {
    return await todoService.update(params.id, body)
  },
  {
    body: UpdateTodoSchema
  })
