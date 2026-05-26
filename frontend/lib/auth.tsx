'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    affiliation: string;
    country?: string;
    orcid?: string;
    phone?: string;
    position?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>('/users/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
    await refreshUser();
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    affiliation: string;
    country?: string;
    orcid?: string;
    phone?: string;
    position?: string;
  }) => {
    await api.post('/auth/register', payload);
    await login(payload.email, payload.password);
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed regardless — backend may be unreachable
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
