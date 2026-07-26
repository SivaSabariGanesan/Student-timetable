import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'timetable_token';

const ROLE_RANK = { superuser: 3, admin: 2, user: 1 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function setToken(token) {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      try { localStorage.setItem(TOKEN_KEY, token); } catch {}
    } else {
      delete api.defaults.headers.common.Authorization;
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) setToken(stored);

    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => { setUser(null); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    if (res.data.token) setToken(res.data.token);
    return res.data.user;
  }

  async function logout() {
    await api.post('/auth/logout');
    setToken(null);
    setUser(null);
  }

  function hasRole(role) {
    if (!user) return false;
    return (ROLE_RANK[user.role] ?? 0) >= (ROLE_RANK[role] ?? 0);
  }

  const isSuperuser = user?.role === 'superuser';
  const isAdmin     = hasRole('admin');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, isSuperuser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
