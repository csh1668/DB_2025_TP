// 사용자 인터페이스 정의
export interface User {
  cno: string;
  name: string;
  passwd: string;
  email: string;
  passportNumber?: string;
}
