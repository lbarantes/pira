import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
})

api.interceptors.request.use((config) => {
  // não acessa localStorage durante SSR
  if (typeof window === 'undefined') return config;

  const token = localStorage.getItem('token');
  if (token) {
    // checa expiração antes de enviar
    try {
      if (isTokenExpired(token)) {
        logout();
        // redireciona para login (somente no browser)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Token expirado'));
      }
    } catch (e) {
      // se falhar ao decodificar, continuará e deixará o header (server pode rejeitar)
    }

    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response, // em caso de passar tudo certo
  (error) => {
    if (error.response?.status === 401) {
      // token inválido/expirado no backend: limpa e redireciona para /login
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  // backend responde { data: { user, token } }
  const payload = res.data?.data;
  if (payload?.token) {
    if (typeof window !== 'undefined') localStorage.setItem('token', payload.token);
  }
  if (payload?.user) {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(payload.user));
    } catch (e) {
      // ignore
    }
  }
  return payload;
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;

  // Prefer stored user object
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      // fallthrough
    }
  }

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub,
      email: payload.email,
    };
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token: string) {
  // tenta decodificar o payload do JWT
  try {
    if (typeof window === 'undefined') return false;
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const payload = JSON.parse(atob(parts[1]));
    // exp pode ser number (segundos) ou string
    const exp = payload.exp;
    if (!exp) return false;
    const expNum = typeof exp === 'string' ? parseInt(exp, 10) : exp;
    if (Number.isNaN(expNum)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return expNum <= nowSec;
  } catch (e) {
    return false;
  }
}
