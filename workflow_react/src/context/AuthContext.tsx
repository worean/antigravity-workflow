// -*- coding: utf-8 -*-
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types';
import { getMe, loginEmail, registerUser } from '@/services/api';
import { queryClient } from '@/lib/queryClient';
import { disconnectSocket, getSocket } from '@/lib/socketClient';
import { preferenceManager } from '@/lib/preferenceManager';

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
  const [user, setUser] = useState<User | null>(() => preferenceManager.currentUser);
  const [token, setToken] = useState<string | null>(() => preferenceManager.authToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 초기 인증 상태 설정 (첫 로딩 시)
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.user);
          preferenceManager.currentUser = res.user;
          preferenceManager.syncFromUserProfile(res.user.preferences);
        } catch (err) {
          console.error('Failed to restore user session:', err);
          preferenceManager.clearAuth();
          disconnectSocket();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  // 로그인 동작
  const login = async (email: string, password?: string) => {
    const res = await loginEmail(email, password);
    if (res.token) {
      preferenceManager.authToken = res.token;
      preferenceManager.currentUser = res.user;
      preferenceManager.syncFromUserProfile(res.user.preferences);

      setToken(res.token);
      setUser(res.user);

      // 소켓 재연결 및 쿼리 캐시 무효화/리패치
      disconnectSocket();
      getSocket(res.token);
      queryClient.clear();
      queryClient.invalidateQueries();
    }
  };

  // 회원가입 동작
  const signup = async (email: string, name: string, password?: string) => {
    await registerUser(email, name, password);
    // signup 후 자동 로그인 시도
    await login(email, password);
  };

  // 로그아웃 동작
  const logout = () => {
    preferenceManager.clearAuth();
    disconnectSocket();
    setToken(null);
    setUser(null);
    queryClient.clear();
    queryClient.resetQueries();
  };

  const updateUserLocal = (updated: User) => {
    setUser(updated);
    preferenceManager.currentUser = updated;
    preferenceManager.syncFromUserProfile(updated.preferences);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
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

/**
 * Authentication을 위한 Hook으로 AuthContext에 접근할 수 있습니다.
 * 컴포넌트 등은 해당 Hook을 사용하여 인증 상태 및 사용자 정보를 가져올 수 있습니다.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
