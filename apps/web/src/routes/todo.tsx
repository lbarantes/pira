import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Todo, CreateTodo, UpdateTodo } from 'shared-types'
import api, { getCurrentUser } from '@/api'
import { useCallback, useState } from 'react'
export const Route = createFileRoute('/todo')({
  component: RouteComponent,
})

function RouteComponent() {
  const [title, setTitle] = useState('');
  const [showCreateSucess, setShowCreateSucess] = useState(false);
  const [showUpdateSucess, setShowUpdateSucess] = useState(false);
  const [user] = useState(() => getCurrentUser());
  const queryClient = useQueryClient();

  const getTodos = useCallback(async () => {
    const res = await api.get<Todo[]>('/todos');
    return res.data;
  }, []);

  const createTodo = useCallback(async (newTodo: CreateTodo) => {
    const res = await api.post<Todo>('/todos', newTodo);
    return res.data;
  }, []);

  const updateTodo = useCallback(async ({ title, completed, todo_id }: { todo_id: string } & UpdateTodo) => {
    const res = await api.patch<Todo>(`/todos/${todo_id}`, { title, completed });
    return res.data;
  }, []);

  const {
    isPending: todosLoading,
    isError: todosError,
    data: todos,
    error: todosErrorObj
  } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos
  })

  const {
    isPending: creatingTodo,
    isError: createError,
    error: createErrorObj,
    mutate: createMutate
  } = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setTitle('');
      setShowCreateSucess(true)
      setTimeout(() => setShowCreateSucess(false), 3000)
    }
  })

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (title.trim() === "") return;
    createMutate({ title })
  }

  const {
    isPending: updatingTodo,
    isError: updateError,
    error: updateErrorObj,
    mutate: updateMutate
  } = useMutation({
    mutationFn: updateTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setShowUpdateSucess(true);
      setTimeout(() => setShowUpdateSucess(false), 3000)
    }
  })

  const handleChange = (e: any, todo_id: string) => {
    updateMutate({completed: e.target.checked, todo_id: todo_id});
  }

  const handleBlur = (e:any, todo_id: string) => {
    updateMutate({title: e.target.innerText, todo_id: todo_id})
  }

  if (todosLoading) return <>Pending...</>;

  if (todosError) return <>Error: {todosErrorObj.message}</>;

  return (
    <>
      <div>
        {user ? `Logado como ${user.username ?? user.email}` : 'Não autenticado'}
      </div>
      <form onSubmit={handleSubmit}>
        <input type='text' className='border border-s-teal-900 border-spacing-1.5' value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type='submit' className='bg-amber-700 hover:cursor-pointeer'>Adicionar To-Do</button>
        <br />
        {creatingTodo && <span>Criando todo</span>}
        {createError && <span>Erro ao criar todo: {createErrorObj.message}</span>}
        {showCreateSucess && <span>Todo criado com sucesso!</span>}
      </form>
      <hr />
      {updatingTodo && <span> - Atualizando todo...</span>}
      {updateError && <span> - Erro ao atualizar, erro: {updateErrorObj.message}</span>}
      {showUpdateSucess && <span> - Todo atualizado com sucesso!</span> }
      <ul>
        {todos.map((todo: Todo) => (
          <li key={todo.id} className='flex'>
            <input type='checkbox' checked={todo.completed} onChange={(e) => handleChange(e, todo.id)}/>
            <span contentEditable suppressContentEditableWarning onBlur={(e) => handleBlur(e, todo.id)}>{todo.title}</span>
          </li>
        ))}
      </ul>
    </>
  )
}
