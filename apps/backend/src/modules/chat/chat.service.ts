import { ChatMessage } from "shared-types";

interface CachedUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  cachedAt: number;
}

// Cache de usuários com TTL de 1 hora
const userCache = new Map<string, CachedUser>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

const getCachedUser = (userId: string): CachedUser | null => {
  const now = Date.now();
  const cached = userCache.get(userId);
  
  // Verifica se existe no cache e se não expirou
  if (cached && (now - cached.cachedAt) < CACHE_TTL) {
    return cached;
  }
  
  // Se expirou, remove do cache
  if (cached) {
    userCache.delete(userId);
  }
  
  return null;
};

const cacheUser = (user: CachedUser) => {
  userCache.set(user.id, {
    ...user,
    cachedAt: Date.now()
  });
};

const clearExpiredCache = () => {
  const now = Date.now();
  for (const [userId, user] of userCache.entries()) {
    if ((now - user.cachedAt) > CACHE_TTL) {
      userCache.delete(userId);
    }
  }
};

// Limpa cache expirado a cada 30 minutos
setInterval(clearExpiredCache, 30 * 60 * 1000);

export const chatService = {
  getCachedUser,
  cacheUser,
  clearExpiredCache
};

const messages: ChatMessage[] = []
