import { NotFoundError } from 'elysia';
import  { Todo, CreateTodo, UpdateTodo } from 'shared-types'

const todosDb: Todo[] = [
  { id: '1', title: 'Configurar o monorepo com Bun', completed: true },
  { id: '2', title: 'Criar o backend com Elysia', completed: false },
  { id: '3', title: 'Criar o frontend com TanStack', completed: false },
];

export const getAll = async () => {
  return todosDb;
}

export const create = async (body: CreateTodo) => {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    title: body.title,
    completed: false,
  };
  todosDb.push(newTodo);
  return newTodo;
};

export const update = async (id: string, body: UpdateTodo) => {
  const todo = todosDb.find((t) => t.id === id);

  if (!todo) {
    // Elysia entende esse erro e o transforma em um 404
    throw new NotFoundError('Todo não encontrado');
  }

  if (body.completed !== undefined) {
    todo.completed = body.completed;
  }
  if (body.title !== undefined) {
    todo.title = body.title;
  }

  return todo;
};
