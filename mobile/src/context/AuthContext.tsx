import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, Session, Role } from '../types';
import * as api from '../api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      const token = await SecureStore.getItemAsync('accessToken');
      if (userStr && token) {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role?: Role) => {
    const session = await api.login({ email, password, role });
    await SecureStore.setItemAsync('accessToken', session.token);
    await SecureStore.setItemAsync('user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    const session = await api.register({ name, email, password, role });
    await SecureStore.setItemAsync('accessToken', session.token);
    await SecureStore.setItemAsync('user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
