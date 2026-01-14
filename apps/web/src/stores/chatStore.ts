import { ChatMessage, } from 'shared-types';
import { create } from 'zustand'

interface ChatState {
  socket: WebSocket | null;
  messages: ChatMessage[];
  isConnected: boolean;

  // Actions
  connect: (groupId: string, channelId: string) => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  messages: [],
  isConnected: false,

  connect: (groupId, channelId) => {
    // 1. Limpar conexão anterior se existir
    const { socket } = get();
    if (socket) {
      console.log('Fechando conexão WebSocket anterior');
      socket.close();
    }

    if (!channelId) return;

    const userStr = localStorage.getItem('user');

    if (!userStr) return;

    const user = JSON.parse(userStr);
    const userId = user.id || user.userId || 'anonymous';
    const username = user.username || user.email || 'Usuário';

    // 3. Montar URL e Conectar
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:3001/ws/chat/${groupId}/${channelId}?userId=${userId}&username=${encodeURIComponent(username)}`;

    console.log('🔗 Connecting to:', wsUrl);
    const newSocket = new WebSocket(wsUrl);

    // 4. Bind Events
    newSocket.onopen = () => {
      console.log('✅ Conectado');
      set({ isConnected: true });
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'history') {
          set({ messages: (data.messages as ChatMessage[]) || [] });
        } else if (data.type === 'message') {
          const newMessage = data.data as ChatMessage;
          set((state) => ({ messages: [...state.messages, newMessage] }));
        }
      } catch (error) {
        console.error('❌ Erro message:', error);
      }
    };

    newSocket.onclose = () => {
      console.log('🔌 Desconectado');
      set({ isConnected: false });
    };

    // Salva o socket no estado
    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) socket.close();
    set({ socket: null, isConnected: false, messages: [] });
  },

  sendMessage: (text) => {
    const { socket } = get();
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = {
          message: text,
          // userId: user.userId,
          // username: user.username
      };

      socket.send(JSON.stringify(payload));
    }
  }
}))
