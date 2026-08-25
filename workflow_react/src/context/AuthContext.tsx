import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { getMe, loginEmail, registerUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, name: string, password?: string) => Promise<void>;
  logout: () => void;
  updateUserLocal: (updated: User) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncPreferencesToStorage = (userObj?: User | null) => {
    if (!userObj || !userObj.preferences) return;
    try {
      const prefs = typeof userObj.preferences === 'string' ? JSON.parse(userObj.preferences) : userObj.preferences;
      if (typeof prefs.isSundayStart === 'boolean') {
        localStorage.setItem('pref_is_sunday_start', String(prefs.isSundayStart));
      }
      if (prefs.defaultPriority) {
        localStorage.setItem('pref_default_priority', String(prefs.defaultPriority));
      }
      if (typeof prefs.compactCards === 'boolean') {
        localStorage.setItem('pref_compact_cards', String(prefs.compactCards));
      }
      if (typeof prefs.desktopNotifications === 'boolean') {
        localStorage.setItem('pref_desktop_notifications', String(prefs.desktopNotifications));
      }
    } catch (e) {
      console.error('Failed to sync user preferences to storage:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.user);
          syncPreferencesToStorage(res.user);
        } catch (err) {
          console.error('Failed to restore user session:', err);
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password?: string) => {
    const res = await loginEmail(email, password);
    if (res.token) {
      localStorage.setItem('auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      syncPreferencesToStorage(res.user);
    }
  };

  const signup = async (email: string, name: string, password?: string) => {
    await registerUser(email, name, password);
    // signup 후 자동 로그인 시도
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const updateUserLocal = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUserLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
