import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import api from '@/api'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get('/groups')
      return response.data.data || []
    },
  })

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      await api.post('/groups', {
        group_name: formData.get('name'),
        group_description: formData.get('description'),
        group_avatar: 'https://via.placeholder.com/150',
      })
      setShowCreateGroup(false)
      window.location.reload()
    } catch (error) {
      alert('Erro ao criar grupo: ' + (error as any).message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Meus Grupos</h1>
          <button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold transition"
          >
            + Novo Grupo
          </button>
        </div>

        {/* Form Criar Grupo */}
        {showCreateGroup && (
          <form
            onSubmit={handleCreateGroup}
            className="bg-gray-800 p-6 rounded mb-8 border border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4">Criar Novo Grupo</h2>
            <div className="space-y-4">
              <input
                name="name"
                placeholder="Nome do grupo"
                required
                className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <textarea
                name="description"
                placeholder="Descrição"
                required
                rows={3}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold transition"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Lista de Grupos */}
        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupsData?.map((group: any) => (
              <Link
                key={group.group_id}
                to={`/group/${group.group_id}` as any}
                className="block"
              >
                <div className="bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded p-6 transition cursor-pointer h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={group.group_avatar}
                      alt={group.group_name}
                      className="w-16 h-16 rounded bg-gray-700"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{group.group_name}</h3>
                      <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded inline-block mt-1">
                        {group.group_status}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {group.group_description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && (!groupsData || groupsData.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-4">Você ainda não tem nenhum grupo</p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold transition"
            >
              Criar um grupo agora
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
