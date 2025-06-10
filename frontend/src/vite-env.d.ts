/// <reference types="vite/client" />

// 환경 변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // 필요한 경우 다른 환경 변수들도 여기에 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// window 인터페이스 확장
interface Window {
  flightCache?: {
    [key: string]: {
      departureAirport: string;
      arrivalAirport: string;
    };
  };
}
