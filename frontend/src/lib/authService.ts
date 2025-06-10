import type { LoginDto, LoginResponse } from '../types/auth';
import type { CreateUserDto, User } from '../types/user';
import { config } from '../config/config';

// config 파일에서 API URL 및 기타 설정 가져오기
const API_URL = config.api.url;

export const authService = {  // 로그인 함수
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginDto),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '로그인에 실패했습니다');
    }

    return response.json();
  },

  // 회원가입 함수
  async register(userData: CreateUserDto): Promise<User> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '회원가입에 실패했습니다');
    }

    return response.json();
  },
  // 사용자 프로필 가져오기
  async getProfile(): Promise<User> {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (!token) {
      throw new Error('인증 토큰이 없습니다');
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      throw new Error('프로필 정보를 가져오지 못했습니다');
    }

    return response.json();
  },

  // 이메일로 사용자 존재 여부 확인
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/users/email/${email}`, {
        method: 'GET',
      });
      
      if (response.status === 404) {
        return false; // 사용자 없음 (사용 가능한 이메일)
      }

      const resp = await response.text();
      
      if (response.ok && resp) {
        return true; // 사용자 존재 (이미 등록된 이메일)
      }
      
      return false;
    } catch (error) {
      console.error('이메일 확인 중 오류 발생:', error);
      return false;
    }
  },

  // 로그아웃 (클라이언트 측에서 토큰 제거)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 토큰 존재 여부로 로그인 상태 확인
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  },

  // 사용자 정보 업데이트
  async updateUserProfile(cno: string, userData: { name?: string; passportNumber?: string }): Promise<User> {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (!token) {
      throw new Error('인증 토큰이 없습니다');
    }

    const response = await fetch(`${API_URL}/users/${cno}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '사용자 정보 업데이트에 실패했습니다');
    }

    // 업데이트 후 최신 사용자 정보 조회
    return this.getProfile();
  },
};
