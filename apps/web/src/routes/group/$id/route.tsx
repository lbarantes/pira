import api from '@/api';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Channel } from 'shared-types';
import {
  ChevronDown,
  Settings,
  UserPlus,
  Bell,
  LogOut,
  Hash,
  Plus,
  Edit,
  Trash
} from 'lucide-react'
import { useState } from 'react';
import { useChatStore } from '@/stores/chatStore';

export const Route = createFileRoute('/group/$id')({
  component: RouteComponent,
})

const mockUser = {
  username: "DevUsuario",
  discriminator: "#1234",
  avatar: "https://github.com/shadcn.png",
  status: "Programando..."
};

function RouteComponent() {
  const { id } = Route.useParams()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{x: number, y: number} | null>(null);

  const { data: group } = useQuery({
    queryKey: ['groupId', id],
    queryFn: async () => {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    },
    staleTime: 1000*60*1
  })

  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
        const response = await api.get(`/groups/${id}/channels`);
        return response.data;
    },
    staleTime: 1000*60*1
  })

  const location = useLocation();

  const activeChannel = channels?.find((channel: Channel) =>
      location.pathname.includes(channel.id)
  );

  const handleOpen = (e: React.MouseEvent) => {
    // Captura a posição do mouse (clientX, clientY)
    // Adicionamos +12 no Y para o menu aparecer um pouco abaixo do cursor
    setMenuPosition({
      x: e.clientX,
      y: e.clientY + 12
    });
  };

  if (group && channels) {
    return (
      <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
        {/* SIDEBAR - Cor Secundária #EDEDED */}
        <aside className='w-72 bg-[#EDEDED] flex flex-col justify-between border-r border-[#2A578E]/10 shrink-0'>

          {/* TOPO: Imagem do Grupo + Nome + Dropdown */}
          <div className='relative z-20'>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className='w-full h-14 px-4 flex items-center justify-between hover:bg-[#21ADE3]/10 transition-colors border-b border-[#2A578E]/10 cursor-pointer outline-none group'
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Squircle Image (Group) */}
                <div className="w-8 h-8 min-w-8 overflow-hidden rounded-[10px] bg-white shadow-sm border border-gray-200">
                  {group.group_avatar ? (
                    <img src={group.group_avatar} alt={group.group_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#0F62AC]">G</div>
                  )}
                </div>
                {/* Fonte Black/Bold para o título */}
                <h1 className="truncate text-base font-black text-[#0F62AC] tracking-tight">{group.group_name}</h1>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#2A578E] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN MENU - Tema Branco */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsDropdownOpen(false)}></div>

                <div className='absolute top-[60px] left-2 w-[270px] bg-white rounded-lg shadow-xl p-1.5 z-20 border border-gray-200 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 origin-top-left'>
                  <div className='flex flex-col gap-0.5'>
                    <DropdownItem icon={<Settings size={16} />} label="Configurações do Servidor" />
                    <DropdownItem icon={<UserPlus size={16} />} label="Convidar pessoas" />
                    <DropdownItem icon={<Bell size={16} />} label="Configurações de Notificação" />
                    <div className='h-px bg-gray-100 my-1 mx-1' />
                    <DropdownItem icon={<LogOut size={16} />} label="Voltar para tela principal" isDestructive />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* LISTA DE CANAIS */}
          <div className='flex-1 overflow-y-auto py-3 px-2 custom-scrollbar'>
             {/* Categoria Label */}
             <div className="px-2 mb-2 flex items-center justify-between group cursor-pointer text-[#2A578E]/80 hover:text-[#0F62AC] transition-colors">
                <span className="text-[11px] font-black uppercase tracking-wide font-sans">Canais de Texto</span>
                {/* Substituído ChevronDown por Plus */}
                <Plus size={16} strokeWidth={3} className="hover:bg-[#21ADE3]/20 rounded p-0.5 transition-colors"/>
             </div>

            <ul className='space-y-0.5'>
              {channels.map((channel: Channel) => {
                const isActive = activeChannel?.id === channel.id;

                return (
                  <li key={channel.id}>
                    <Link
                      to={`/group/${id}/channel/${channel.id}`}
                      // onClick={() => connect(id, channel.id)}
                      onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); handleOpen(e);}}
                      className={`
                        flex items-center px-2 py-1.5 rounded-sm transition-all group active:scale-[0.98]
                        ${isActive
                          ? 'bg-white text-[#0F62AC] shadow-sm ring-1 ring-black/5'
                          : 'text-slate-600 hover:bg-white/60 hover:text-[#21ADE3]'}
                      `}
                    >
                      {/* Ícone Hash */}
                      <Hash
                        className={`w-5 h-5 mr-1.5 ${isActive ? 'text-[#21ADE3]' : 'text-[#2A578E]/40 group-hover:text-[#21ADE3]'}`}
                        strokeWidth={2.5}
                      />
                      {/* Nome do Canal - Segoe UI Semibold (simulado via font-semibold) */}
                      <span className={`truncate text-[15px] ${isActive ? 'font-bold' : 'font-semibold'}`}>
                        {channel.channel_name}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* FOOTER: Usuário - Fundo Azul Primário (#0F62AC) para destaque */}
          <div className='h-14 bg-[#0F62AC] flex items-center px-2 py-1.5 gap-1 shrink-0 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]'>
            <div className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-md hover:bg-white/10 cursor-pointer flex-1 min-w-0 transition-colors group">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/10 group-hover:ring-white/30 transition-all">
                   <img src={mockUser.avatar} alt="User" className="w-full h-full object-cover" />
                </div>
                {/* Status Indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#21ADE3] rounded-full border-2 border-[#0F62AC]"></div>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold text-white truncate leading-tight">{mockUser.username}</span>
                <span className="text-[11px] text-[#21ADE3] font-sans truncate leading-tight opacity-90">{mockUser.status}</span>
              </div>
            </div>

            {/* Botões de Ação do Footer (Brancos sobre azul) */}
            <div className="flex items-center">
                <FooterButton icon={<Settings size={18} />} />
            </div>
          </div>

        </aside>

        {/* MENU DE CONTEXTO (RIGHT CLICK) */}
        {menuPosition && (
            <>
              {/* Backdrop invisível para fechar ao clicar fora */}
              <div
                className="fixed inset-0 z-40"
                onContextMenu={(e) => { e.preventDefault(); setMenuPosition(null); }} // Fecha se clicar com direito fora
                onClick={() => setMenuPosition(null)}
              />

              {/* Menu Flutuante */}
              <div
                className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-1.5 w-52 animate-in fade-in zoom-in-95 duration-75 ring-1 ring-black/5"
                style={{ top: menuPosition.y, left: menuPosition.x }}
              >
                  <div className="flex flex-col gap-0.5">
                    <DropdownItem icon={<Edit size={16} />} label="Editar canal" />
                    <DropdownItem icon={<Settings size={16} />} label="Configurações do canal" />
                    <div className='h-px bg-gray-100 my-1 mx-1' />
                    <DropdownItem icon={<Trash size={16} />} label="Excluir canal" isDestructive />
                  </div>
              </div>
            </>
        )}

        {/* CONTEÚDO PRINCIPAL - Fundo Branco */}
        <main className='flex-1 bg-white flex flex-col'>
          <div className="h-14 border-b border-[#2A578E]/10 shadow-sm bg-white flex items-center px-4 z-10">
             <Hash className="w-7 h-7 text-[#2A578E]/30 mr-3" strokeWidth={2} />
             <div className="flex flex-col justify-center">
                <h3 className="font-bold text-lg text-slate-800 leading-none">
                  {activeChannel ? activeChannel.channel_name : 'Boas-Vindas'}
                </h3>
                {activeChannel && <span className="text-xs text-[#2A578E]/60 font-semibold font-sans">{activeChannel.channel_description}</span>}
             </div>
          </div>
          <div className="flex-1 p-0 overflow-hidden bg-white">
             <Outlet />
          </div>
        </main>
      </div>
    )
  }

  return <div className="flex h-screen items-center justify-center bg-white text-[#0F62AC] font-bold">Carregando...</div>
}

// Componente do Dropdown (Estilo Claro)
function DropdownItem({ icon, label, isDestructive = false }: { icon: React.ReactNode, label: string, isDestructive?: boolean }) {
  return (
    <button className={`
      w-full flex items-center justify-between px-3 py-2 rounded-sm text-[13px] transition-colors group font-semibold
      ${isDestructive
        ? 'text-red-600 hover:bg-red-50'
        : 'text-slate-600 hover:bg-[#0F62AC] hover:text-white'}
    `}>
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
    </button>
  )
}

// Botões do Footer (Estilo para fundo Azul Escuro)
function FooterButton({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-white/20 text-white/80 hover:text-white transition-all">
            {icon}
        </button>
    )
}
