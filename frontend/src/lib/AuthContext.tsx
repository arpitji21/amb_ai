import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from './api';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('leip_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('leip_user');
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    // Backend expects OAuth2PasswordRequestForm: x-www-form-urlencoded with `username`/`password`.
    const form = new URLSearchParams();
    form.set('username', email);
    form.set('password', password);
    const { data } = await api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    localStorage.setItem('leip_token', data.access_token);
    localStorage.setItem('leip_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user as AuthUser;
  }

  function logout() {
    localStorage.removeItem('leip_token');
    localStorage.removeItem('leip_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
