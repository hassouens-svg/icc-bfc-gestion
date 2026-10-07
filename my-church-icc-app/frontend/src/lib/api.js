/**
 * Toutes les communications avec le backend passent par `api`.
 * Exemple :  const fideles = await api.get('/fideles?etape=accueil');
 */
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const TOKEN_KEY = 'icc_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(status, detail) {
    const message = typeof detail === 'string' ? detail
      : detail?.message || (Array.isArray(detail) ? detail.map((d) => `${d.loc?.slice(-1)[0]} : ${d.msg}`).join(' · ') : 'Erreur');
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (res.status === 401 && token) {
    setToken(null);
    window.location.href = '/connexion';
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.detail ?? res.statusText);
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b = {}) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
};

/** Construit une query string en ignorant les valeurs vides. */
export const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false));
  return s.toString() ? `?${s}` : '';
};
