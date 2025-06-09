export interface LoginDto {
  email: string;
  passwd: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface JwtPayload {
  cno: string;
  email: string;
  name: string;
}

export interface AuthContextType {
  user: JwtPayload | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
  loading: boolean;
}
