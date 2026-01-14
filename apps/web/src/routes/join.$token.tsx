import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import api from '@/api'
import { useState } from 'react'

export const Route = createFileRoute('/join/$token')({
  component: JoinPage,
})

function JoinPage() {
  const { token } = Route.useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  // Validar convite
  const { data: validationData, isLoading: isValidating } = useQuery({
    queryKey: ['validate-invite', token],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/invites/validate/${token}`
        ).then(r => r.json())
        
        if (!response.data) throw new Error('Token inválido')
        return response.data
      } catch (err) {
        setError((err as any).message || 'Erro ao validar convite')
        throw err
      }
    },
  })

  // Entrar no grupo
  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/groups/${validationData?.invite?.group_id}/invites/join/${token}`)
      return response.data
    },
    onSuccess: (data) => {
      setTimeout(() => {
        navigate({ to: `/group/${data.data.group_id}` })
      }, 1500)
    },
    onError: (error) => {
      setError((error as any).message || 'Erro ao entrar no grupo')
    },
  })

  const invite = validationData?.invite

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Validando convite...</p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-red-500 rounded p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">❌ Convite Inválido</h1>
          <p className="text-gray-300 mb-6">{error || 'Este link de convite não é válido ou expirou'}</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  if (joinMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-2">Sucesso!</h1>
          <p className="text-gray-300 mb-4">Você entrou no grupo com sucesso</p>
          <p className="text-gray-400">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full">
        {/* Avatar do Grupo */}
        <img
          src={invite?.group?.group_avatar || 'https://via.placeholder.com/150'}
          alt={invite?.group?.group_name}
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />

        {/* Nome e Descrição */}
        <h1 className="text-2xl font-bold text-center mb-2">{invite?.group?.group_name}</h1>
        <p className="text-gray-400 text-center mb-6">{invite?.group?.group_description}</p>

        {/* Informações do Convite */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 p-4 rounded mb-6 text-sm">
          <p className="mb-2">
            <span className="text-gray-300">Usos disponíveis:</span>{' '}
            <span className="font-semibold">
              {invite?.max_uses ? `${invite.uses_count}/${invite.max_uses}` : '∞'}
            </span>
          </p>
          <p>
            <span className="text-gray-300">Expira em:</span>{' '}
            <span className="font-semibold">
              {new Date(invite?.expires_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>

        {/* Botão Entrar */}
        <button
          onClick={() => joinMutation.mutate()}
          disabled={joinMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition mb-3"
        >
          {joinMutation.isPending ? 'Entrando...' : '✨ Entrar no Grupo'}
        </button>

        {joinMutation.error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-700 p-3 rounded text-sm text-red-300">
            {(joinMutation.error as any).message || 'Erro ao entrar no grupo'}
          </div>
        )}
      </div>
    </div>
  )
}
