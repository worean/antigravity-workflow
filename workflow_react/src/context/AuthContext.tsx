import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types';
import { getMe, loginEmail, registerUser, verifyEmail as verifyEmailApi, resendVerification as resendVerificationApi, loginGoogle } from '@/services/api';
import { queryClient } from '@/lib/queryClient';
import { disconnectSocket, getSocket } from '@/lib/socketClient';
import { prefRepository } from '@/lib/prefRepository';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ requireVerification?: boolean; email?: string } | void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  signup: (email: string, name: string, password?: string) => Promise<{ requireVerification?: boolean; email?: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<string>;
  loginWithTokenAndUser: (token: string, user: User) => void;
  logout: () => void;
  updateUserLocal: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => prefRepository.currentUser);
  const [token, setToken] = useState<string | null>(() => prefRepository.authToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 초기 인증 상태 설정 (첫 로딩 시)
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getMe();
          setUser(res.user);
          prefRepository.currentUser = res.user;
          prefRepository.syncFromUserProfile(res.user.preferences);
        } catch (err) {
          console.error('Failed to restore user session:', err);
          prefRepository.clearAuth();
          disconnectSocket();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  // 세션 설정 공통 헬퍼
  const setSession = (newToken: string, newUser: User) => {
    prefRepository.authToken = newToken;
    prefRepository.currentUser = newUser;
    prefRepository.syncFromUserProfile(newUser.preferences);

    setToken(newToken);
    setUser(newUser);

    disconnectSocket();
    getSocket(newToken);
    queryClient.clear();
    queryClient.invalidateQueries();
  };

  // 일반 이메일 로그인
  const login = async (email: string, password?: string) => {
    const res = await loginEmail(email, password);
    if (res.requireVerification) {
      return { requireVerification: true, email: res.email };
    }
    if (res.token) {
      setSession(res.token, res.user);
    }
  };

  // Google OAuth 로그인
  const loginWithGoogle = async (accessToken: string) => {
    const res = await loginGoogle(accessToken);
    if (res.token) {
      setSession(res.token, res.user);
    }
  };

  // 회원가입
  const signup = async (email: string, name: string, password?: string) => {
    const res = await registerUser(email, name, password);
    return res;
  };

  // 6자리 OTP 이메일 인증
  const verifyEmail = async (email: string, code: string) => {
    const res = await verifyEmailApi(email, code);
    if (res.token) {
      setSession(res.token, res.user);
    }
  };

  // 인증번호 재발송
  const resendVerification = async (email: string) => {
    const res = await resendVerificationApi(email);
    return res.message || '인증코드가 재발송되었습니다.';
  };

  // URL 리다이렉트 등으로 들어왔을 때 즉시 세션 설정
  const loginWithTokenAndUser = (newToken: string, newUser: User) => {
    setSession(newToken, newUser);
  };

  // 로그아웃
  const logout = () => {
    prefRepository.clearAuth();
    disconnectSocket();
    setToken(null);
    setUser(null);
    queryClient.clear();
    queryClient.resetQueries();
  };

  const updateUserLocal = (updated: User) => {
    setUser(updated);
    prefRepository.currentUser = updated;
    prefRepository.syncFromUserProfile(updated.preferences);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        loginWithGoogle,
        signup,
        verifyEmail,
        resendVerification,
        loginWithTokenAndUser,
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
