import { Elysia, t } from "elysia";
import { ChatMessage } from "shared-types";
import { chatService } from "./chat.service";
import { db } from "../../db";
import { users } from "../../db/schema/users";
import { eq } from "drizzle-orm";

// Estrutura para armazenar mensagens por grupo/canal
// Usamos um Map aninhado para melhor performance: groupId -> channelId -> messages[]
const groupChannelMessages = new Map<string, Map<string, ChatMessage[]>>();

// Configuração para limite de mensagens em memória por canal
const MAX_MESSAGES_PER_CHANNEL = 1000;
const MESSAGE_RETENTION_TIME = 24 * 60 * 60 * 1000; // 24 horas

// Função auxiliar para obter a chave única do canal
const getChannelKey = (groupId: string, channelId: string) => `${groupId}:${channelId}`;

// Função auxiliar para limpar mensagens antigas
const cleanOldMessages = (messages: ChatMessage[]) => {
  const now = Date.now();
  const cutoffTime = now - MESSAGE_RETENTION_TIME;
  
  // Remove mensagens mais antigas que 24 horas
  return messages.filter(msg => (msg.timestamp || 0) > cutoffTime);
};

// Função para obter ou criar um canal de mensagens
const getChannelMessages = (groupId: string, channelId: string): ChatMessage[] => {
  if (!groupChannelMessages.has(groupId)) {
    groupChannelMessages.set(groupId, new Map());
  }
  
  const group = groupChannelMessages.get(groupId)!;
  
  if (!group.has(channelId)) {
    group.set(channelId, []);
  }
  
  return group.get(channelId) as ChatMessage[];
};

// Função para adicionar uma mensagem
const addMessage = (groupId: string, channelId: string, message: ChatMessage) => {
  const messages = getChannelMessages(groupId, channelId);
  messages.push(message);
  
  // Limpa mensagens antigas
  const cleaned = cleanOldMessages(messages);
  groupChannelMessages.get(groupId)!.set(channelId, cleaned);
  
  // Limita número de mensagens
  if (cleaned.length > MAX_MESSAGES_PER_CHANNEL) {
    cleaned.splice(0, cleaned.length - MAX_MESSAGES_PER_CHANNEL);
  }
};

export const chatSocket = new Elysia({ prefix: '/ws/chat' })
  .ws('/:groupId/:channelId', {
    params: t.Object({
      groupId: t.String(),
      channelId: t.String()
    }),
    query: t.Object({
      userId: t.String(),
      username: t.String(),
      userAvatar: t.Optional(t.String())
    }),
    body: t.Object({
      message: t.String()
    }),
    open(ws) {
      const { groupId, channelId } = ws.data.params;
      const { userId, username } = ws.data.query;
      
      const roomKey = getChannelKey(groupId, channelId);
      
      console.log(`[WS] 🔗 Novo cliente conectado: ${username} (${userId}) em ${roomKey}`);
      
      // Se inscreve no canal específico
      ws.subscribe(roomKey);
      
      // Obtém o histórico de mensagens
      const history = getChannelMessages(groupId, channelId);
      
      console.log(`[WS] 📨 Enviando histórico: ${history.length} mensagens`);
      
      // Envia histórico ao conectar
      ws.send({
        type: 'history',
        messages: history,
        groupId,
        channelId
      });
    },
    
    message(ws, data) {
      const { groupId, channelId } = ws.data.params;
      const { userId, username: queryUsername } = ws.data.query;
      
      const roomKey = getChannelKey(groupId, channelId);
      
      console.log(`[WS] 💬 Mensagem de ${queryUsername}: "${data.message}"`);
      
      // Tenta obter do cache primeiro
      let userAvatar: string | undefined;
      let finalUsername = queryUsername; // padrão é o username da query
      
      const cachedUser = chatService.getCachedUser(userId);
      if (cachedUser) {
        console.log(`[WS] ✅ Usuário ${cachedUser.username} encontrado no cache`);
        userAvatar = cachedUser.avatar;
        finalUsername = cachedUser.username; // usa o username do banco em cache
      } else {
        // Se não estiver no cache, tenta buscar do banco (async)
        db.select()
          .from(users)
          .where(eq(users.id, userId))
          .execute()
          .then((result) => {
            if (result.length > 0) {
              const user = result[0];
              // Armazena no cache
              chatService.cacheUser({
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: undefined, // você pode adicionar avatar depois se necessário
                cachedAt: Date.now()
              });
              console.log(`[WS] 🔄 Usuário ${user.username} adicionado ao cache`);
            }
          })
          .catch((error) => {
            console.error(`[WS] ❌ Erro ao buscar usuário: ${error}`);
          });
      }
      
      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        userId,
        username: finalUsername, // usa o username correto (do cache ou do banco)
        message: data.message,
        timestamp: Date.now(),
        groupId,
        channelId,
        userAvatar
      };
      
      // Armazena a mensagem
      addMessage(groupId, channelId, chatMessage);
      
      // Envia para o cliente que enviou a mensagem
      ws.send({
        type: 'message',
        data: chatMessage,
        groupId,
        channelId
      });
      
      // Publica para TODOS os outros clientes no canal
      ws.publish(roomKey, {
        type: 'message',
        data: chatMessage,
        groupId,
        channelId
      });
    },
    
    close(ws) {
      const { groupId, channelId } = ws.data.params;
      const { username } = ws.data.query;
      const roomKey = getChannelKey(groupId, channelId);
      
      console.log(`[WS] 🔌 Cliente desconectado: ${username} de ${roomKey}`);
      
      ws.unsubscribe(roomKey);
    }
  })