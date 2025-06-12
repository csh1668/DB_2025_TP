import { config } from '../config/config';
import { formatDateKST } from './utils';

// 좌석 정보 인터페이스 정의
export interface SeatInfo {
  seatClass: string;
  price: number;
  no_of_seats: number;
}

// 항공편 인터페이스 정의
export interface Flight {
  airline: string;
  flightNo: string;
  departureDateTime: string;
  arrivalDateTime: string;
  departureAirport: string;
  arrivalAirport: string;
  seats?: SeatInfo[];  // 좌석 정보 추가 (비즈니스석, 이코노미석 등)
}

// 검색 파라미터 인터페이스 정의
interface SearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: string;
}

// API 기본 URL 설정
const API_URL = `${config.api.url}/airplanes`;
const SEATS_URL = `${config.api.url}/seats`;

// 항공편 검색 함수
export async function searchFlights(params: SearchParams): Promise<{airplanes: Flight[], total: number}> {
  try {
    // URL 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.departureAirport) queryParams.append('departureAirport', params.departureAirport);
    if (params.arrivalAirport) queryParams.append('arrivalAirport', params.arrivalAirport);
    if (params.departureDate) {
      // 날짜 형식을 일관되게 처리 (YYYY-MM-DD 형식)
      queryParams.append('departureDate', formatDateKST(params.departureDate, 'YYYY-MM-DD'));
    }

    console.log('API 호출 URL:', `${API_URL}?${queryParams.toString()}`);
    
    // API 호출
    const response = await fetch(`${API_URL}?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('항공편 검색 중 오류가 발생했습니다');
    }
    
    const flightData = await response.json();
    
    // 각 항공편에 대해 좌석 정보 가져오기
    const flightsWithSeats = await Promise.all(
      flightData.airplanes.map(async (flight: Flight) => {
        // 좌석 정보 가져오기
        const seats = await getSeatsForFlight(flight.flightNo, flight.departureDateTime);
        return {
          ...flight,
          seats: seats
        };
      })
    );
    
    return {
      airplanes: flightsWithSeats,
      total: flightData.total
    };
  } catch (error) {
    console.error('항공편 검색 중 오류 발생:', error);
    return { airplanes: [], total: 0 };
  }
}

// 특정 항공편 상세 정보 조회
export async function getFlightDetails(flightNo: string, departureDateTime: string | Date): Promise<Flight | null> {
  try {
    // 날짜를 항상 같은 형식으로 서버에 전송
    const formattedDateTime = formatDateKST(departureDateTime, 'YYYY-MM-DD');
    const encodedDateTime = encodeURIComponent(formattedDateTime);
    const response = await fetch(`${API_URL}/${flightNo}/${encodedDateTime}`);
    
    if (!response.ok) {
      throw new Error('항공편 상세 정보를 불러오는데 실패했습니다');
    }
    
    return await response.json();
  } catch (error) {
    console.error('항공편 상세 정보 요청 중 오류 발생:', error);
    return null;
  }
}

// 항공편 ID(flightNo)와 출발 시간으로 좌석 정보 조회
export async function getSeatsForFlight(flightNo: string, departureDateTime: string): Promise<SeatInfo[]> {
  try {
    // 날짜 형식은 ISO 문자열로 변환
    const encodedDateTime = encodeURIComponent(departureDateTime);
    const url = `${SEATS_URL}/flight/${flightNo}/${encodedDateTime}`;
    
    console.log('좌석 정보 API 호출:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('좌석 정보 조회 실패:', response.statusText);
      return []; // 오류 시 빈 배열 반환
    }
    
    return await response.json();
  } catch (error) {
    console.error('좌석 정보 조회 중 오류:', error);
    return []; // 오류 시 빈 배열 반환
  }
}

// 특정 항공편 조회 함수 (flightNo와 departureDateTime으로 조회)
export async function getFlightDetail(flightNo: string, departureDateTime: string): Promise<Flight | null> {
  try {
    // 날짜 형식 변환 필요 (URL에서 사용 가능한 형태로)
    const formattedDate = encodeURIComponent(departureDateTime);
    
    // API 호출
    const response = await fetch(`${API_URL}/${flightNo}/${formattedDate}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`항공편 정보 조회 실패: ${response.statusText}`);
    }
    
    const flightData = await response.json();
    
    // 좌석 정보 조회 (가격 포함)
    try {
      const seatsResponse = await fetch(`${SEATS_URL}/flight/${flightNo}/${formattedDate}`);
      if (seatsResponse.ok) {
        const seatsData = await seatsResponse.json();
        flightData.seats = seatsData;
      }
    } catch (error) {
      console.error('좌석 정보 조회 중 오류 발생:', error);
      // 좌석 정보 조회 실패해도 기본 항공편 정보는 반환
    }
    
    return flightData;
  } catch (error) {
    console.error('항공편 상세 조회 중 오류 발생:', error);
    return null;
  }
}
