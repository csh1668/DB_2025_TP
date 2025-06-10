import type { Airport } from '../components/forms/airportSelectorPopover';
import { config } from '../config/config';

// API 기본 URL 설정
const API_URL = `${config.apiBaseUrl}/airports`;

// 서버에서 받아온 공항 데이터를 프론트엔드 Airport 타입으로 변환하는 함수
function parseAirportString(airportString: string): Airport {
  // 예: "인천 (ICN) (대한민국)" 형태의 문자열 파싱
  const match = airportString.match(/^(.+) \(([A-Z]+)\) \((.+)\)$/);
  if (match) {
    const [, name, code, country] = match;
    return {
      id: code.toLowerCase(),
      name,
      code,
      country
    };
  }
  
  // 간단한 파싱 실패시 기본값 제공
  return {
    id: airportString,
    name: airportString,
    code: airportString,
    country: ''
  };
}

// 모든 공항 가져오기
export async function getAllAirports(): Promise<Airport[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('공항 데이터를 불러오는데 실패했습니다');
    }
    
    const airportStrings: string[] = await response.json();
    return airportStrings.map(parseAirportString);
  } catch (error) {
    console.error('공항 데이터 요청 중 오류 발생:', error);
    return [];
  }
}

// 국가별 공항 가져오기
export async function getAirportsByCountry(country: string): Promise<Airport[]> {
  try {
    const encodedCountry = encodeURIComponent(country);
    const response = await fetch(`${API_URL}/by-country/${encodedCountry}`);
    if (!response.ok) {
      throw new Error(`${country} 공항 데이터를 불러오는데 실패했습니다`);
    }
    
    const airportStrings: string[] = await response.json();
    return airportStrings.map(parseAirportString);
  } catch (error) {
    console.error(`${country} 공항 데이터 요청 중 오류 발생:`, error);
    return [];
  }
}

// 모든 국가 목록 가져오기
export async function getCountries(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/countries`);
    if (!response.ok) {
      throw new Error('국가 목록을 불러오는데 실패했습니다');
    }
    
    return await response.json();
  } catch (error) {
    console.error('국가 목록 요청 중 오류 발생:', error);
    return [];
  }
}

// 코드로 공항 정보 가져오기
export async function getAirportByCode(code: string): Promise<Airport> {
  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(code)}`);
    if (!response.ok) {
      throw new Error(`공항 코드 ${code}에 대한 정보를 불러오는데 실패했습니다`);
    }
    
    const airportString: string = await response.text();
    
    // 서버에서 받은 응답 파싱 (예: "인천 (ICN)")
    const match = airportString.match(/^(.+) \(([A-Z]+)\)$/);
    if (match) {
      const [, name, airportCode] = match;
      return {
        id: airportCode.toLowerCase(),
        name,
        code: airportCode,
        country: '' // 국가 정보는 별도로 포함되어 있지 않음
      };
    }
    
    // 파싱 실패 시 기본값 제공
    return {
      id: code.toLowerCase(),
      name: airportString || code,
      code: code.toUpperCase(),
      country: ''
    };
  } catch (error) {
    console.error(`공항 코드 ${code} 조회 중 오류 발생:`, error);
    return {
      id: code.toLowerCase(),
      name: code,
      code: code.toUpperCase(),
      country: ''
    };
  }
}
