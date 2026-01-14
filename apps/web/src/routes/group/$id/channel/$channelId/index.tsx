import { useChatStore } from '@/stores/chatStore'
import { createFileRoute } from '@tanstack/react-router'
import { FileVideo, MoreVertical, Paperclip, Reply, SendHorizontal, Smile } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from 'shared-types';

export const Route = createFileRoute('/group/$id/channel/$channelId/')({
  component: RouteComponent,
})

const CharacterCounter = ({ currentLength, maxLength = 3000 }: { currentLength: number, maxLength?: number }) => {
    const remaining = maxLength - currentLength;

    // Só exibe se faltar menos de 100 caracteres
    if (remaining >= 100) return null;

    // Estágio: Ultrapassou o limite
    if (remaining < 0) {
        return (
            <span className="text-red-500 font-bold text-xs mr-2 animate-in fade-in">
                {remaining}
            </span>
        );
    }

    // Estágio: Perto do limite (Círculo SVG)
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    // Porcentagem de 0 a 100 baseada nos últimos 100 chars (100 remaining = 100%, 0 remaining = 0%)
    const percentage = (remaining / 100);
    const dashOffset = circumference * (1 - percentage);

    // Cor muda para vermelho quando faltar muito pouco (ex: < 20)
    const strokeColor = remaining < 20 ? '#EF4444' : '#EAB308'; // red-500 vs yellow-500
    const textColor = remaining < 20 ? 'text-red-500' : 'text-yellow-600';

    return (
        <div className="relative flex items-center justify-center mr-2 w-8 h-8 animate-in zoom-in duration-200">
            {/* SVG do Círculo */}
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 24 24">
                {/* Círculo de fundo (track) - Opcional, deixei sem para ser "oco" como pedido,
                    mas se quiser um rastro cinza, descomente abaixo:
                <circle cx="12" cy="12" r={radius} stroke="#e5e7eb" strokeWidth="2" fill="none" />
                */}
                <circle
                    cx="12"
                    cy="12"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="transition-all duration-200 ease-out"
                />
            </svg>
            {/* Número no meio */}
            <span className={`absolute text-[10px] font-bold ${textColor}`}>
                {remaining}
            </span>
        </div>
    );
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

const isToday = (date: Date) => {
  return isSameDay(date, new Date());
};

const formatMessageTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (isToday(date)) {
        return timeStr;
    } else if (isYesterday(date)) {
        return `ontem ${timeStr}`;
    } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year} ${timeStr}`;
    }
};

const formatSeparatorDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const DateSeparator = ({ date }: { date: Date }) => {
    return (
        <div className="flex items-center justify-center my-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {formatSeparatorDate(date)}
            </span>
            <div className="h-px bg-slate-200 flex-1"></div>
        </div>
    );
};

export default function RouteComponent() {
  const { id, channelId } = Route.useParams();
  const { connect, sendMessage, messages } = useChatStore();

  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 3000;
  const isOverLimit = message.length > MAX_CHARS;

  useEffect(() => {
    connect(id, channelId);
  }, [channelId, id]);

  // Scroll para o final sempre que chegar mensagem nova
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  // Função de Envio
  const handleSendMessage = () => {
    if (!message.trim() || isOverLimit) return;
    sendMessage(message);
    setMessage('');

    // Reseta altura do textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  // Manipulador de Teclas (Enter vs Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita pular linha
      handleSendMessage();
    }
  };

  // Auto-resize do textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; // Max height 120px
  };

  return (
    <div className="flex flex-col h-full bg-white relative font-['Segoe_UI']">

      {/* --- ÁREA DE MENSAGENS --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col">
        {/* Placeholder de início do canal (Opcional, decorativo) */}
        <div className="mt-auto space-y-6">
          <div className="mt-8 mb-8 text-center">
              <div className="w-16 h-16 bg-[#E3F2FD] text-[#0F62AC] rounded-full mx-auto flex items-center justify-center mb-3">
                  <HashIcon size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Bem-vindo ao #{channelId}</h2>
              <p className="text-slate-500 text-sm">Este é o começo do histórico deste canal.</p>
          </div>
        </div>

        {/* Lista de Mensagens */}
        {messages.map((msg: ChatMessage, index: number) => {
            const currentDate = new Date(msg.timestamp);
            const prevDate = index > 0 ? new Date(messages[index - 1].timestamp) : null;

            // Mostra separador se for a primeira msg OU se o dia mudou em relação à anterior
            const showSeparator = !prevDate || !isSameDay(currentDate, prevDate);

            return (
                <React.Fragment key={msg.id}>
                    {showSeparator && <DateSeparator date={currentDate} />}
                    <MessageItem message={msg} />
                </React.Fragment>
            );
        })}

        {/* Elemento invisível para scroll automático */}
        <div ref={messagesEndRef} />
      </div>

      {/* --- ÁREA DE INPUT --- */}
      <div className="p-4 bg-white border-t border-[#EDEDED] relative z-20">

        {/* Popups (Emoji/GIF) - Simulados */}
        {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 bg-white shadow-xl border border-slate-200 rounded-lg p-4 w-64 h-64 animate-in slide-in-from-bottom-2 fade-in">
                <p className="text-center text-slate-400 mt-20">🎨 Seletor de Emojis aqui</p>
                <div className="grid grid-cols-5 gap-2 mt-4">
                    {['😀','😂','🥰','🚀','💻'].map(emoji => (
                        <button key={emoji} onClick={() => { setMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-2xl hover:bg-slate-100 rounded">
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {showGifPicker && (
            <div className="absolute bottom-20 left-12 bg-white shadow-xl border border-slate-200 rounded-lg p-4 w-80 h-64 animate-in slide-in-from-bottom-2 fade-in">
                <p className="text-center text-slate-400 mt-24">🎞️ Integração Tenor GIF aqui</p>
            </div>
        )}

        {/* Barra de Digitação */}
        <div className="flex items-center gap-2 bg-[#F5F7FA] p-2 rounded-xl border border-transparent focus-within:border-[#21ADE3] focus-within:ring-2 focus-within:ring-[#21ADE3]/20 transition-all shadow-sm">

            {/* Botão Anexo (Extra) */}
            <button className="p-2 text-slate-400 hover:text-[#0F62AC] hover:bg-white rounded-full transition-colors shrink-0">
                <Paperclip size={20} />
            </button>

            {/* Input Expansível */}
            <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={`Conversar em #${channelId || 'canal'}...`}
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 resize-none py-2.5 max-h-[120px] [&::-webkit-scrollbar]:hidden leading-relaxed focus:outline-none"
                style={{ minHeight: '44px' }}
            />

            {/* Ações da Direita */}
            <div className="flex items-center gap-1 shrink-0 pb-1">
                <CharacterCounter currentLength={message.length} maxLength={MAX_CHARS} />

                <button
                    onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                    className={`p-2 rounded-lg transition-colors ${showGifPicker ? 'text-[#21ADE3] bg-white shadow-sm' : 'text-slate-400 hover:text-[#0F62AC] hover:bg-white'}`}
                    title="GIFs do Tenor"
                >
                    <FileVideo size={20} />
                </button>

                <button
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                    className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'text-[#21ADE3] bg-white shadow-sm' : 'text-slate-400 hover:text-[#0F62AC] hover:bg-white'}`}
                    title="Emojis"
                >
                    <Smile size={20} />
                </button>

                {/* Botão Enviar com Lógica de Bloqueio */}
                <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isOverLimit}
                    className={`
                        p-2 rounded-lg ml-1 transition-all duration-200
                        ${message.trim() && !isOverLimit
                            ? 'bg-[#0F62AC] text-white shadow-md hover:bg-[#0d5291] active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                    `}
                >
                    <SendHorizontal size={20} />
                </button>
            </div>
            </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-2 text-right pr-2">
            <strong>Enter</strong> para enviar, <strong>Shift + Enter</strong> para quebrar linha
        </p>
      </div>
  )
}

// --- SUB-COMPONENTE: MENSAGEM INDIVIDUAL ---
function MessageItem({ message }: { message: any }) {
  const formattedTime = formatMessageTime(message.timestamp);
    return (
        <div className="group relative flex gap-4 px-2 py-1 hover:bg-[#F8FAFC] rounded-lg -mx-2 transition-colors duration-200">
            {/* Avatar */}
            <div className="shrink-0 mt-1 cursor-pointer">
                <img
                    src={message.avatar || "https://github.com/shadcn.png"}
                    alt={message.username}
                    className="w-10 h-10 rounded-full object-cover shadow-sm hover:shadow-md transition-shadow"
                />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-[#0F62AC] hover:underline cursor-pointer text-[15px]">
                        {message.username}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                        {formattedTime}
                    </span>
                </div>

                <p className="text-[15px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {message.message}
                </p>
            </div>

            {/* Ações da Mensagem (Só aparecem no hover) */}
            <div className="absolute right-2 -top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center bg-white shadow-md border border-slate-100 rounded-lg overflow-hidden z-10 scale-95 group-hover:scale-100">
                <button className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-[#21ADE3] transition-colors" title="Responder">
                    <Reply size={14} />
                </button>
                <div className="w-px h-3 bg-slate-100"></div>
                <button className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-[#21ADE3] transition-colors" title="Mais opções">
                    <MoreVertical size={14} />
                </button>
            </div>
        </div>
    )
}

// Ícone auxiliar
function HashIcon({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="4" y1="9" x2="20" y2="9"></line>
            <line x1="4" y1="15" x2="20" y2="15"></line>
            <line x1="10" y1="3" x2="8" y2="21"></line>
            <line x1="16" y1="3" x2="14" y2="21"></line>
        </svg>
    )
}
