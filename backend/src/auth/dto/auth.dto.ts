// 로그인 DTO (Data Transfer Object)
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '유효한 이메일 주소가 아닙니다' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다' })
  email: string;

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
