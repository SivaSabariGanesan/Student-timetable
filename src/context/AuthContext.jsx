import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'timetable_token';

const ROLE_RANK = { superuser: 3, admin: 2, user: 1 };

function loadToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => { setUser(null); saveToken(null); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    if (res.data.token) saveToken(res.data.token);
    return res.data.user;
  }

  async function logout() {
    await api.post('/auth/logout');
    saveToken(null);
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
