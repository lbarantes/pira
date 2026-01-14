import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  MessageSquare,
  Users,
  Hash,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  CheckSquare,
  FileText,
  PieChart,
  Calendar,
  Settings
} from 'lucide-react';

import api from '@/api';

export const Route = createFileRoute('/group/$id/')({
  component: RouteComponent,
})

export default function RouteComponent() {
  const { id } = Route.useParams()

  const { data: group } = useQuery({
    queryKey: ['groupId', id],
    queryFn: async () => {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    },
    staleTime: 1000*60*1
  })

  if (group) {
    return (
      <div className="flex flex-col h-full w-full bg-[#FAFAFA] font-['Segoe_UI','sans-serif'] overflow-y-auto custom-scrollbar">
        <div className="flex-1 flex flex-col items-start justify-start p-10 max-w-6xl mx-auto w-full animate-in fade-in duration-500">

            {/* --- CABEÇALHO EMPRESARIAL --- */}
            <div className="w-full bg-white rounded-lg border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">

                {/* Lado Esquerdo: Imagem/Logo */}
                <div className="relative group shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-white border border-slate-100 shadow-inner overflow-hidden">
                        {group.group_avatar ? (
                            <img src={group.group_avatar} alt={group.group_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#EDEDED] text-[#0F62AC]">
                                <LayoutDashboard size={40} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Lado Direito: Informações */}
                <div className="flex flex-col text-center md:text-left flex-1 pt-1">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {group.group_name}
                        </h1>
                    </div>

                    <p className="text-base text-slate-500 leading-relaxed mb-6 font-['Segoe_UI'] max-w-3xl">
                        {group.group_description || "Selecione um módulo para iniciar suas atividades."}
                    </p>

                    {/* Stats / Meta Info - Estilo mais sóbrio */}
                    {/*<div className="flex items-center justify-center md:justify-start gap-6 border-t border-slate-100 pt-4 mt-auto w-full">
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Users size={16} className="text-slate-400" />
                            <span className="font-semibold">{group.member_count}</span>
                            <span className="text-slate-400">colaboradores</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="font-semibold">{group.online_count}</span>
                            <span className="text-slate-400">ativos agora</span>
                        </div>
                    </div>*/}
                </div>
            </div>

            {/* --- DASHBOARD / ACTION CARDS --- */}
            <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-[#0F62AC]" />
                        Painel de Acesso Rápido
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    <ActionCard
                        icon={<CheckSquare size={24} />}
                        title="Minhas Tarefas"
                        description="Visualize suas pendências, prazos e atualize status de tickets."
                    />
                    {/*<ActionCard
                        icon={<Calendar size={24} />}
                        title="Calendário da Equipe"
                        description="Verifique agendamentos, reuniões e disponibilidade do time."
                    />*/}
                    <ActionCard
                        icon={<Users size={24} />}
                        title="Diretório de Membros"
                        description="Encontre contatos e gerencie permissões de acesso."
                    />
                    <ActionCard
                        icon={<Settings size={24} />}
                        title="Configurações"
                        description="Gerencie integrações e preferências do ambiente."
                    />
                </div>
            </div>

        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-[#0F62AC]">
        <div className="w-8 h-8 border-2 border-[#21ADE3]/30 border-t-[#0F62AC] rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Carregando workspace...</p>
    </div>
  )
}

// Componente auxiliar para os cards "Enterprise"
function ActionCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col p-5 rounded-lg bg-white border border-slate-200 hover:border-[#21ADE3] hover:shadow-md transition-all duration-200 group cursor-pointer h-full">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded bg-[#F5F7FA] text-slate-500 group-hover:bg-[#0F62AC] group-hover:text-white transition-colors duration-200">
                    {icon}
                </div>
                <h3 className="font-bold text-slate-700 group-hover:text-[#0F62AC] transition-colors text-sm md:text-base">
                    {title}
                </h3>
            </div>
            <p className="text-sm text-slate-500 leading-snug font-['Segoe_UI']">
                {description}
            </p>
        </div>
    )
}
