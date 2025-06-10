import { config } from '@/config/config';

const API_URL = config.api.url;

// API 호출 에러 처리
const handleErrors = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '서버 오류가 발생했습니다.');
  }
  return response.json();
};

// 예약 생성 인터페이스
interface CreateReservationRequest {
  flightNo: string;
  departureDateTime: string;
  seatClass: string;
  payment: number;
  cno: string;
}

// 예약 응답 인터페이스
interface Reservation {
  flightNo: string;
  departureDateTime: string;
  seatClass: string;
  payment: number;
  reserveDateTime: string;
  cno: string;
}

// 취소 생성 인터페이스
interface CreateCancellationRequest {
  flightNo: string;
  departureDateTime: string;
  seatClass: string;
  refund: number; 
  cno: string;
}

// 취소 응답 인터페이스
interface Cancellation {
  flightNo: string;
  departureDateTime: string;
  seatClass: string;
  refund: number;
  cancelDateTime: string;
  cno: string;
}

// 예약 생성 (항공권 구매)
export const createReservation = async (data: CreateReservationRequest): Promise<Reservation> => {
  const response = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  return handleErrors(response);
};

// 사용자 예약 목록 조회
export const getUserReservations = async (cno: string, fromDate?: string, toDate?: string): Promise<Reservation[]> => {
  let url = `${API_URL}/reservations/customer/${cno}`;
  
  // 쿼리 파라미터 배열 생성
  const queryParams = [];
  
  // 시작 날짜 필터가 있는 경우 쿼리 파라미터 추가
  if (fromDate) {
    queryParams.push(`fromDate=${fromDate}`);
  }
  
  // 종료 날짜 필터가 있는 경우 쿼리 파라미터 추가
  if (toDate) {
    queryParams.push(`toDate=${toDate}`);
  }
  
  // 쿼리 파라미터가 있으면 URL에 추가
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  const response = await fetch(url, {
    credentials: 'include',
  });

  return handleErrors(response);
};

// 예약 취소 (환불 처리)
export const createCancellation = async (data: CreateCancellationRequest): Promise<Cancellation> => {
  const response = await fetch(`${API_URL}/cancellations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  return handleErrors(response);
};

// 사용자 취소 목록 조회
export const getUserCancellations = async (cno: string, fromDate?: string, toDate?: string): Promise<Cancellation[]> => {
  let url = `${API_URL}/cancellations/customer/${cno}`;
  
  // 쿼리 파라미터 배열 생성
  const queryParams = [];
  
  // 시작 날짜 필터가 있는 경우 쿼리 파라미터 추가
  if (fromDate) {
    queryParams.push(`fromDate=${fromDate}`);
  }
  
  // 종료 날짜 필터가 있는 경우 쿼리 파라미터 추가
  if (toDate) {
    queryParams.push(`toDate=${toDate}`);
  }
  
  // 쿼리 파라미터가 있으면 URL에 추가
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }
  
  const response = await fetch(url, {
    credentials: 'include',
  });

  return handleErrors(response);
};

// 위약금 계산 함수 (출발일 기준)
export const calculatePenalty = (departureDate: Date): number => {
  const today = new Date();
  const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // 출발 날짜 기준: 15일 이전 150,000원, 14-4일 사이 180,000원, 3일 이내 250,000원, 당일 전액
  if (daysUntilDeparture > 15) {
    return 150000;
  } else if (daysUntilDeparture >= 4) {
    return 180000;
  } else if (daysUntilDeparture >= 1) {
    return 250000;
  } else {
    // 당일 취소는 환불 불가 (전액 위약금)
    return -1; // -1은 환불 불가를 의미
  }
};
