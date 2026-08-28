'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'WORKER_MANAGER';
  assignedProjectIds: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  logout: async () => {},
  refreshAuth: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch auth session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    setUser(data.user);
    router.push('/');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  // Show loading spinner while checking initial auth session for protected routes
  if (loading && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="text-3xl animate-bounce">🏗️</div>
        <div className="text-xs font-bold text-slate-600">Verifying Site Security Session...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
