'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '@/types';
import { ApiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Checks the JWT exp claim without a library. Returns true if the token is expired or unparseable. */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function clearAuthStorage() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    clearAuthStorage();
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      if (isTokenExpired(token)) {
        // JWT is expired — clear stale session so Cloudflare re-auth leads to login
        clearAuthStorage();
      } else {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          clearAuthStorage();
        }
      }
    }

    setIsLoading(false);
  }, []);

  // Listen for 401 events dispatched by ApiClient so expired/revoked sessions are cleared globally
  useEffect(() => {
    const handle401 = () => {
      clearAuthStorage();
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handle401);
    return () => window.removeEventListener('auth:unauthorized', handle401);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await ApiClient.post<AuthResponse>('/auth/login', {
        email: username,
        password,
      });
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await ApiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
      });
      
      // If token is null, user needs to verify email
      if (!response.token) {
        return;
      }
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
