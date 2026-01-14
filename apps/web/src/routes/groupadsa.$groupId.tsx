import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api'
import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from 'shared-types'

export const Route = createFileRoute('/groupadsa/$groupId')({
  component: GroupPage,
})

function GroupPage() {
  const { groupId } = Route.useParams()
  const queryClient = useQueryClient()

  // States para modais
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [showCreateInvite, setShowCreateInvite] = useState(false)
  const [showAssignRole, setShowAssignRole] = useState(false)
  const [showListInvites, setShowListInvites] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [showChatTabs, setShowChatTabs] = useState(false)
  const [chatTab, setChatTab] = useState<'messages' | 'list'>('messages')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [rolePermissions, setRolePermissions] = useState({
    is_admin: false,
    group_can_manage_roles: false,
    group_can_view_channels: false,
    group_can_manage_channels: false,
    members_can_invite: false,
    members_can_kick: false,
    members_can_ban: false,
    chat_can_send_messages: false,
    chat_can_send_links: false,
    chat_can_send_files: false,
    chat_can_manage_messages: false,
    chat_can_fix_messages: false,
    chat_can_view_history: false,
  })

  // Queries
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}`)
      return response.data.data
    },
  })

  const { data: channels } = useQuery({
    queryKey: ['channels', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/channels`)
      return response.data.data || []
    },
  })

  const { data: roles } = useQuery({
    queryKey: ['roles', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/roles`)
      return response.data.data || []
    },
  })

  const { data: members } = useQuery({
    queryKey: ['members', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/members`)
      return response.data.data || []
    },
  })

  const { data: invites } = useQuery({
    queryKey: ['invites', groupId],
    queryFn: async () => {
      const response = await api.get(`/groups/${groupId}/invites`)
      return response.data.data || []
    },
    enabled: showListInvites,
  })

  // Mutations
  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return api.post(`/groups/${groupId}/channels`, {
        channel_name: data.name,
        channel_description: data.description,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', groupId] })
      setShowCreateChannel(false)
    },
  })

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; permissions: any }) => {
      const roleResponse = await api.post(`/groups/${groupId}/roles`, {
        role_name: data.name,
        role_color: data.color,
      })
      const roleId = roleResponse.data.data.id
      await api.post(`/groups/${groupId}/roles/${roleId}/permissions`, data.permissions)
      return roleResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', groupId] })
      setShowCreateRole(false)
      setRolePermissions({
        is_admin: false,
        group_can_manage_roles: false,
        group_can_view_channels: false,
        group_can_manage_channels: false,
        members_can_invite: false,
        members_can_kick: false,
        members_can_ban: false,
        chat_can_send_messages: false,
        chat_can_send_links: false,
        chat_can_send_files: false,
        chat_can_manage_messages: false,
        chat_can_fix_messages: false,
        chat_can_view_history: false,
      })
    },
  })

  const createInviteMutation = useMutation({
    mutationFn: async (data: { expiration: string; uses: string }) => {
      return api.post(`/groups/${groupId}/invites`, {
        expiration_type: data.expiration,
        uses_type: data.uses,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', groupId] })
      setShowCreateInvite(false)
    },
  })

  const assignRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; roleId: string }) => {
      return api.post(`/groups/${groupId}/users/${data.userId}/roles`, {
        user_id: data.userId,
        role_id: data.roleId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', groupId] })
      setShowAssignRole(false)
      setSelectedRole('')
      setSelectedUser('')
    },
  })

  const handleCreateChannel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await createChannelMutation.mutateAsync({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    })
  }

  const handleCreateRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await createRoleMutation.mutateAsync({
      name: formData.get('name') as string,
      color: formData.get('color') as string,
      permissions: rolePermissions,
    })
  }

  const handleCreateInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createInviteMutation.mutateAsync({
      expiration: formData.get('expiration') as string,
      uses: formData.get('uses') as string,
    })
    if (result.data?.data?.link) {
      alert('Link de convite criado!\n\n' + result.data.data.link)
    }
  }

  const handleAssignRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await assignRoleMutation.mutateAsync({
      userId: selectedUser,
      roleId: selectedRole,
    })
  }

  // WebSocket connection for chat
  useEffect(() => {
    // Cleanup previous connection
    if (wsRef.current) {
      console.log('Fechando conexão WebSocket anterior')
      wsRef.current.close()
    }

    // Only connect if a channel is selected
    if (!selectedChannel) {
      console.log('❌ Nenhum canal selecionado, não conectando ao WebSocket')
      return
    }

    // Get user info from localStorage
    let userId = 'anonymous'
    let username = 'Usuário'

    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        userId = user.id || user.userId || 'anonymous'
        username = user.username || user.email || 'Usuário'
        console.log('📦 User Data from localStorage:', { userId, username })
      } catch (e) {
        console.error('❌ Erro ao parsear user do localStorage:', e)
      }
    } else {
      console.warn('⚠️ Nenhum usuário encontrado no localStorage')
    }

    // Se o usuário é anônimo, avisa
    if (userId === 'anonymous') {
      console.warn('⚠️ Usuário anônimo detectado. Você não está logado!')
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//localhost:3001/ws/chat/${groupId}/${selectedChannel}?userId=${userId}&username=${encodeURIComponent(username)}`

    console.log('🔗 WebSocket URL:', wsUrl)

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ Chat conectado com sucesso ao servidor')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'history') {
          setMessages(data.messages || [])
        } else if (data.type === 'message') {
          setMessages((prev) => {
            const updated = [...prev, data.data]
            return updated
          })
        } else {
          console.warn('⚠️ Tipo de mensagem desconhecido:', data.type)
        }
      } catch (error) {
        console.error('❌ Erro ao parsear mensagem:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket erro:', error)
    }

    ws.onclose = () => {
      console.log('🔌 Chat desconectado do servidor')
    }

    wsRef.current = ws

    return () => {
      console.log('🧹 Limpando conexão WebSocket')
      ws.close()
    }
  }, [selectedChannel, groupId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ message: messageInput }))
    setMessageInput('')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <img
              src={group?.group_avatar}
              alt={group?.group_name}
              className="w-24 h-24 rounded bg-gray-700"
            />
            <div>
              <h1 className="text-4xl font-bold mb-2">{group?.group_name}</h1>
              <p className="text-gray-400">{group?.group_description}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção Esquerda: Canais e Convites */}
          <div className="space-y-8">
            {/* Canais */}
            <div className="bg-gray-800 border border-gray-700 rounded p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Canais</h2>
                <button
                  onClick={() => setShowCreateChannel(!showCreateChannel)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm font-semibold transition"
                >
                  + Adicionar
                </button>
              </div>

              {showCreateChannel && (
                <form onSubmit={handleCreateChannel} className="mb-4 p-4 bg-gray-700 rounded">
                  <input
                    name="name"
                    placeholder="Nome do canal"
                    required
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded mb-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <textarea
                    name="description"
                    placeholder="Descrição"
                    required
                    rows={2}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded mb-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createChannelMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-sm font-semibold transition disabled:opacity-50"
                    >
                      Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateChannel(false)}
                      className="bg-gray-600 hover:bg-gray-500 px-4 py-1 rounded text-sm font-semibold transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {channels?.map((channel: any) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannel(channel.id)
                      setShowChatTabs(true)
                    }}
                    className={`w-full text-left p-3 rounded transition ${
                      selectedChannel === channel.id
                        ? 'bg-blue-600 border border-blue-500'
                        : 'bg-gray-700 hover:bg-gray-650 border border-gray-700'
                    }`}
                  >
                    <h3 className="font-semibold">{channel.channel_name}</h3>
                    <p className="text-xs text-gray-300">{channel.channel_description}</p>
                  </button>
                ))}
                {!channels || channels.length === 0 && (
                  <p className="text-gray-400 text-sm py-4">Nenhum canal ainda</p>
                )}
              </div>
            </div>

            {/* Convites */}
            <div className="bg-gray-800 border border-gray-700 rounded p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Convites</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateInvite(!showCreateInvite)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm font-semibold transition"
                  >
                    + Gerar
                  </button>
                  <button
                    onClick={() => setShowListInvites(!showListInvites)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-1 rounded text-sm font-semibold transition"
                  >
                    Ver Links
                  </button>
                </div>
              </div>

              {showCreateInvite && (
                <form onSubmit={handleCreateInvite} className="mb-4 p-4 bg-gray-700 rounded">
                  <select
                    name="expiration"
                    defaultValue="7_days"
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded mb-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="30_minutes">30 Minutos</option>
                    <option value="1_hour">1 Hora</option>
                    <option value="6_hours">6 Horas</option>
                    <option value="12_hours">12 Horas</option>
                    <option value="1_day">1 Dia</option>
                    <option value="7_days">7 Dias</option>
                  </select>
                  <select
                    name="uses"
                    defaultValue="unlimited"
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded mb-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="unlimited">Ilimitado</option>
                    <option value="1_use">1 Uso</option>
                    <option value="5_uses">5 Usos</option>
                    <option value="10_uses">10 Usos</option>
                    <option value="25_uses">25 Usos</option>
                    <option value="50_uses">50 Usos</option>
                    <option value="100_uses">100 Usos</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createInviteMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-sm font-semibold transition disabled:opacity-50"
                    >
                      Gerar Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateInvite(false)}
                      className="bg-gray-600 hover:bg-gray-500 px-4 py-1 rounded text-sm font-semibold transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {showListInvites && (
                <div className="space-y-2">
                  {invites?.map((invite: any) => (
                    <div key={invite.id} className="bg-gray-700 p-3 rounded text-xs">
                      <p className="font-semibold mb-1">Token: {invite.token.slice(0, 15)}...</p>
                      <p>Usos: {invite.uses_count}/{invite.max_uses || '∞'}</p>
                      <p>Expira: {new Date(invite.expires_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ))}
                  {!invites || invites.length === 0 && (
                    <p className="text-gray-400 text-sm py-2">Nenhum convite ainda</p>
                  )}
                </div>
              )}

              {!showCreateInvite && !showListInvites && (
                <p className="text-gray-400 text-sm py-4">Gere ou visualize os convites</p>
              )}
            </div>
          </div>

          {/* Seção Direita: Cargos */}
          <div className="bg-gray-800 border border-gray-700 rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Cargos & Permissões</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateRole(!showCreateRole)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm font-semibold transition"
                >
                  + Novo
                </button>
                <button
                  onClick={() => setShowAssignRole(!showAssignRole)}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-1 rounded text-sm font-semibold transition"
                >
                  Atribuir
                </button>
              </div>
            </div>

            {showCreateRole && (
              <form onSubmit={handleCreateRole} className="mb-4 p-4 bg-gray-700 rounded max-h-96 overflow-y-auto">
                <input
                  name="name"
                  placeholder="Nome do cargo"
                  required
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded mb-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-2 mb-4">
                  <label className="text-sm text-gray-300">Cor:</label>
                  <input
                    name="color"
                    type="color"
                    defaultValue="#3b82f6"
                    className="w-12 h-10 bg-gray-600 border border-gray-500 rounded cursor-pointer"
                  />
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Permissões de Grupo</h4>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.is_admin}
                      onChange={(e) =>
                        setRolePermissions({ ...rolePermissions, is_admin: e.target.checked })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Admin</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.group_can_manage_roles}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          group_can_manage_roles: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Gerenciar Cargos</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.group_can_view_channels}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          group_can_view_channels: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Ver Canais</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.group_can_manage_channels}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          group_can_manage_channels: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Gerenciar Canais</span>
                  </label>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Permissões de Membros</h4>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.members_can_invite}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          members_can_invite: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Convidar Membros</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.members_can_kick}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          members_can_kick: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Expulsar Membros</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.members_can_ban}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          members_can_ban: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Banir Membros</span>
                  </label>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Permissões de Chat</h4>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.chat_can_send_messages}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          chat_can_send_messages: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Enviar Mensagens</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.chat_can_send_links}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          chat_can_send_links: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Enviar Links</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.chat_can_send_files}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          chat_can_send_files: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Enviar Arquivos</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.chat_can_manage_messages}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          chat_can_manage_messages: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Gerenciar Mensagens</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.chat_can_fix_messages}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          chat_can_fix_messages: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Fixar Mensagens</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions.chat_can_view_history}
                      onChange={(e) =>
                        setRolePermissions({
                          ...rolePermissions,
                          chat_can_view_history: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Ver Histórico</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createRoleMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-sm font-semibold transition disabled:opacity-50"
                  >
                    Criar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateRole(false)}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-1 rounded text-sm font-semibold transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {showAssignRole && (
              <form onSubmit={handleAssignRole} className="mb-4 p-4 bg-gray-700 rounded">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded mb-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Escolha um usuário</option>
                  {members?.map((member: any) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.user?.username || member.user?.email || member.user_id}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  required
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded mb-2 border border-gray-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Escolha um cargo</option>
                  {roles?.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={assignRoleMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-sm font-semibold transition disabled:opacity-50"
                  >
                    Atribuir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignRole(false)}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-1 rounded text-sm font-semibold transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roles?.map((role: any) => (
                <div key={role.id} className="bg-gray-700 p-3 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.role_color }}
                    ></div>
                    <h3 className="font-semibold">{role.role_name}</h3>
                  </div>
                </div>
              ))}
              {!roles || roles.length === 0 && (
                <p className="text-gray-400 text-sm py-4">Nenhum cargo criado</p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        {showChatTabs && selectedChannel && (
          <div className="mt-8 bg-gray-800 border border-gray-700 rounded p-6">
            <div className="flex gap-4 mb-4 border-b border-gray-700">
              <button
                onClick={() => setChatTab('messages')}
                className={`pb-2 px-4 font-semibold transition ${
                  chatTab === 'messages'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Mensagens
              </button>
              <button
                onClick={() => setChatTab('list')}
                className={`pb-2 px-4 font-semibold transition ${
                  chatTab === 'list'
                    ? 'border-b-2 border-blue-500 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Lista
              </button>
            </div>

            {chatTab === 'messages' && (
              <div className="flex flex-col h-96">
                <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-700 rounded flex flex-col justify-end space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      {/* Cabeçalho da mensagem com foto e nome */}
                      <div className="flex items-center gap-2 mb-1">
                        {msg.userAvatar ? (
                          <img
                            src={msg.userAvatar}
                            alt={msg.username}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
                            {msg.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-blue-400">{msg.username}</span>
                      </div>
                      {/* Corpo da mensagem com suporte a quebras de linha */}
                      <div className="text-gray-200 pl-8 whitespace-pre-wrap">
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <textarea
                    placeholder="Digite uma mensagem... (Shift+Enter para quebra de linha)"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                      // Shift+Enter permite quebra de linha automaticamente
                    }}
                    rows={3}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition self-end"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {chatTab === 'list' && (
              <div className="text-center py-8 text-gray-400">
                <p>Em breve...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
