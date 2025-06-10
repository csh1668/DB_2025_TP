import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { authService } from '../lib/authService';
import type { AuthContextType, JwtPayload } from '../types/auth';
import type { CreateUserDto } from '../types/user';

// JWT 토큰 디코딩 함수
function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error('토큰 파싱 오류:', error);
    return null;
  }
}

// 기본값 생성
const defaultAuthContext: AuthContextType = {
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoggedIn: false,
  loading: true,
};

// 컨텍스트 생성
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// 컨텍스트 프로바이더 컴포넌트
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기 로딩 시 로컬 스토리지에서 토큰 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 토큰 파싱
          const decoded = parseJwt(token);
          if (decoded) {
            setUser(decoded);
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error('인증 상태 확인 오류:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);
  // 로그인 함수
  const login = async (emailOrCno: string, passwd: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ emailOrCno, passwd });
      const { accessToken } = response;
      
      localStorage.setItem('token', accessToken);
      
      const decodedUser = parseJwt(accessToken);
      if (decodedUser) {
        setUser(decodedUser);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 함수
  const register = async (userData: CreateUserDto) => {
    setLoading(true);
    try {
      await authService.register(userData);
      // 회원가입 후 자동 로그인
      await login(userData.email, userData.passwd);
    } catch (error) {
      console.error('회원가입 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  // 컨텍스트 값
  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoggedIn,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 커스텀 훅
export const useAuth = () => useContext(AuthContext);
