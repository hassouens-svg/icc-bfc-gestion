import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, getToken, setToken } from './api';

const AuthContext = createContext(null);
export const ROLES_ADMIN = ['super_admin', 'pasteur'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { token, user } = await api.post('/auth/login', { username, password });
    setToken(token);
    setUser(user);
  };
  const logout = () => { setToken(null); setUser(null); };
  const isAdmin = !!user && ROLES_ADMIN.includes(user.role);

  return <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Protège une page : redirige vers /connexion si l'utilisateur n'est pas connecté. */
export function RequireAuth({ children, admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-10 text-center text-slate-500">Chargement…</div>;
  if (!user) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  if (admin && !isAdmin) return <div className="p-10 text-center text-slate-500">Accès réservé aux administrateurs.</div>;
  return children;
}
