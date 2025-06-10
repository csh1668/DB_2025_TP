// 로그인 DTO (Data Transfer Object)
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: '이메일 또는 아이디는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '이메일 또는 아이디는 필수 입력 항목입니다' })
  emailOrCno: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다' })
  passwd: string;
}

// 로그인 응답 인터페이스
export interface LoginResponse {
  accessToken: string;
}

// JWT 토큰 페이로드 인터페이스
export interface JwtPayload {
  cno: string;
  email: string;
  name: string;
}
