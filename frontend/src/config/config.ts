
// 환경 변수 관련 설정을 중앙에서 관리하는 파일
export const config = {
  // API 관련 설정
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:3000', // 기본값 제공
    timeout: 30000, // API 요청 타임아웃 (밀리초)
  },
  
  // 인증 관련 설정
  auth: {
    tokenKey: 'token', // 로컬 스토리지에 저장되는 토큰 키
    userKey: 'user', // 로컬 스토리지에 저장되는 사용자 정보 키
    adminCno: import.meta.env.VITE_ADMIN_CNO || '', // 관리자 계정 CNO
  },
};
