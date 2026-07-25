import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const ROLE_RANK = { superuser: 3, admin: 2, user: 1 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  /** True if the logged-in user has at least the given role rank. */
  function hasRole(role) {
    if (!user) return false;
    return (ROLE_RANK[user.role] ?? 0) >= (ROLE_RANK[role] ?? 0);
  }

  const isSuperuser = user?.role === 'superuser';
  const isAdmin     = hasRole('admin');   // true for admin AND superuser

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
