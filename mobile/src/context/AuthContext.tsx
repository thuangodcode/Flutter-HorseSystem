import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Storage from '../utils/storage';
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
      const userStr = await Storage.getItemAsync('user');
      const token = await Storage.getItemAsync('accessToken');
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
    await Storage.setItemAsync('accessToken', session.token);
    await Storage.setItemAsync('user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    const session = await api.register({ name, email, password, role });
    await Storage.setItemAsync('accessToken', session.token);
    await Storage.setItemAsync('user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const logout = async () => {
    await Storage.deleteItemAsync('accessToken');
    await Storage.deleteItemAsync('user');
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
