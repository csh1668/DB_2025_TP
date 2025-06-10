import { Logger } from '@nestjs/common';
import * as moment from 'moment-timezone';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseService } from '../database/database.service';

// 환경 변수 로드
dotenv.config();

const logger = new Logger('SampleData');

// 항공사 정보
const airlines = [
  { name: '대한항공', code: 'KE' },
  { name: '아시아나항공', code: 'OZ' },
  { name: '제주항공', code: '7C' },
  { name: '진에어', code: 'LJ' },
  { name: '에어서울', code: 'RS' },
  { name: '티웨이항공', code: 'TW' },
  { name: '에어부산', code: 'BX' },
  { name: '일본항공', code: 'JL' },
  { name: '전일본공수', code: 'NH' },
  { name: '피치항공', code: 'MM' }
];

// 한국-일본 공항 정보
const koreanAirports = [
  { name: '인천', code: 'ICN' },
  { name: '김포', code: 'GMP' },
  { name: '김해', code: 'PUS' },
  { name: '제주', code: 'CJU' }
];

const japaneseAirports = [
  { name: '도쿄(나리타)', code: 'NRT' },
  { name: '오사카', code: 'KIX' },
  { name: '후쿠오카', code: 'FUK' },
  { name: '삿포로', code: 'CTS' }
];

// 기타 인기 아시아 공항
const otherAsianAirports = [
  { name: '베이징', code: 'PEK' },
  { name: '상하이', code: 'PVG' },
  { name: '방콕', code: 'BKK' },
  { name: '싱가포르', code: 'SIN' }
];

// 미국 공항
const usAirports = [
  { name: '로스앤젤레스', code: 'LAX' },
  { name: '뉴욕', code: 'JFK' }
];

// 유럽 공항
const europeanAirports = [
  { name: '런던', code: 'LHR' },
  { name: '파리', code: 'CDG' }
];

// 좌석 클래스 정보
const seatClasses = ['Economy', 'Business'];

// 무작위 정수 생성 함수 (min  x < max)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

// 무작위 항공편 번호 생성 함수
function generateFlightNumber(airlineCode: string): string {
  const numDigits = getRandomInt(3, 5); // 3-4자리 숫자
  let number = '';
  for (let i = 0; i < numDigits; i++) {
    number += getRandomInt(0, 10).toString();
  }
  return `${airlineCode}${number}`;
}

// 비행 시간 계산 함수 (출발-도착 공항에 따라 다르게 설정)
function calculateFlightDuration(departure: string, arrival: string): number {
  // 한국-일본 노선: 1~3시간
  if ((koreanAirports.some(ap => ap.code === departure) && japaneseAirports.some(ap => ap.code === arrival)) ||
      (japaneseAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    return getRandomInt(60, 180);
  }
  
  // 한국-중국/동남아 노선: 3~5시간
  if ((koreanAirports.some(ap => ap.code === departure) && otherAsianAirports.some(ap => ap.code === arrival)) ||
      (otherAsianAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    return getRandomInt(180, 300);
  }
  
  // 한국-미국 노선: 10~14시간
  if ((koreanAirports.some(ap => ap.code === departure) && usAirports.some(ap => ap.code === arrival)) ||
      (usAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    return getRandomInt(600, 840);
  }
  
  // 한국-유럽 노선: 11~15시간
  if ((koreanAirports.some(ap => ap.code === departure) && europeanAirports.some(ap => ap.code === arrival)) ||
      (europeanAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    return getRandomInt(660, 900);
  }
  
  // 국내선: 30분~1시간 30분
  if (koreanAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival)) {
    return getRandomInt(30, 90);
  }
  
  // 일본 국내선: 1~2시간
  if (japaneseAirports.some(ap => ap.code === departure) && japaneseAirports.some(ap => ap.code === arrival)) {
    return getRandomInt(60, 120);
  }
  
  // 기본값: 2~8시간
  return getRandomInt(120, 480);
}

// 가격 계산 함수 (거리, 클래스에 따라 다르게 설정)
function calculatePrice(departure: string, arrival: string, seatClass: string): number {
  let basePrice = 0;
  
  // 기본 가격 설정
  if ((koreanAirports.some(ap => ap.code === departure) && japaneseAirports.some(ap => ap.code === arrival)) ||
      (japaneseAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    // 한국-일본 노선
    basePrice = getRandomInt(250000, 450000);
  } else if ((koreanAirports.some(ap => ap.code === departure) && otherAsianAirports.some(ap => ap.code === arrival)) ||
            (otherAsianAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    // 한국-중국/동남아 노선
    basePrice = getRandomInt(350000, 650000);
  } else if ((koreanAirports.some(ap => ap.code === departure) && usAirports.some(ap => ap.code === arrival)) ||
            (usAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    // 한국-미국 노선
    basePrice = getRandomInt(1200000, 1800000);
  } else if ((koreanAirports.some(ap => ap.code === departure) && europeanAirports.some(ap => ap.code === arrival)) ||
            (europeanAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival))) {
    // 한국-유럽 노선
    basePrice = getRandomInt(1400000, 2000000);
  } else if (koreanAirports.some(ap => ap.code === departure) && koreanAirports.some(ap => ap.code === arrival)) {
    // 국내선
    basePrice = getRandomInt(80000, 150000);
  } else if (japaneseAirports.some(ap => ap.code === departure) && japaneseAirports.some(ap => ap.code === arrival)) {
    // 일본 국내선
    basePrice = getRandomInt(120000, 200000);
  } else {
    // 기타 노선
    basePrice = getRandomInt(500000, 1000000);
  }
  
  // 좌석 클래스에 따른 가격 조정
  if (seatClass === 'Business') {
    return Math.round(basePrice * getRandomInt(250, 350) / 100); // 비즈니스 클래스 가격은 일반석의 2.5~3.5배
  }
  
  // 이코노미 클래스 가격에 약간의 랜덤성 추가
  return Math.round(basePrice * getRandomInt(90, 110) / 100);
}

// 무작위 시간 생성 함수 (0시 ~ 23시 사이)
function getRandomHour(): number {
  return getRandomInt(0, 24);
}

async function bootstrap() {
  // NestJS 앱 인스턴스 생성
  const app = await NestFactory.create(AppModule);
  const dbService = app.get(DatabaseService);
  
  // 수동으로 DatabaseService 초기화
  await dbService.onModuleInit();
  
  try {
    logger.log('샘플 데이터 생성 프로세스 시작');
    
    // 기존 데이터 삭제
    await dbService.executeNonQuery('DELETE FROM SEATS', []);
    await dbService.executeNonQuery('DELETE FROM AIRPLANE', []);
    
    logger.log('기존 데이터 삭제 완료');
    
    // 항공편 데이터 생성 (2025년 6월 1일 ~ 2025년 7월 31일)
    const startDate = moment('2025-06-01');
    const endDate = moment('2025-07-31');
    
    logger.log(`${startDate.format('YYYY-MM-DD')}부터 ${endDate.format('YYYY-MM-DD')}까지의 항공편 생성 시작`);
    
    // 모든 생성 명령문을 담을 배열
    const totalFlightCount = {
      count: 0
    };

    // 자주 사용되는 공항 경로 조합 생성
    const commonRoutes = [];
    
    // 한국-일본 노선 조합 (주요 노선)
    for (const depAirport of koreanAirports) {
      for (const arrAirport of japaneseAirports) {
        commonRoutes.push({ departure: depAirport, arrival: arrAirport });
      }
    }
    
    // 일본-한국 노선 조합 (왕복)
    for (const depAirport of japaneseAirports) {
      for (const arrAirport of koreanAirports) {
        commonRoutes.push({ departure: depAirport, arrival: arrAirport });
      }
    }
    
    // 국내선 노선 조합
    for (const depAirport of koreanAirports) {
      for (const arrAirport of koreanAirports) {
        if (depAirport.code !== arrAirport.code) {
          commonRoutes.push({ departure: depAirport, arrival: arrAirport });
        }
      }
    }
    
    // 기타 인기 국제선 노선 몇 개 추가
    for (const depAirport of koreanAirports) {
      // 주요 아시아 노선
      for (const arrAirport of otherAsianAirports) {
        commonRoutes.push({ departure: depAirport, arrival: arrAirport });
      }
      
      // 미국, 유럽 장거리 노선
      if (depAirport.code === 'ICN') { // 인천에서만 장거리 노선
        for (const arrAirport of [...usAirports, ...europeanAirports]) {
          commonRoutes.push({ departure: depAirport, arrival: arrAirport });
        }
      }
    }
    
    logger.log(`총 ${commonRoutes.length}개의 노선 조합 생성`);
    
    for (let date = moment(startDate); date.isSameOrBefore(endDate); date.add(1, 'days')) {
      logger.log(`${date.format('YYYY-MM-DD')} 날짜의 항공편 생성 시작`);
      
      // 각 경로별로 항공편 생성
      for (const route of commonRoutes) {
        // 각 경로당 약 3~7개의 항공편 생성
        const flightsPerRoute = getRandomInt(3, 8);
        
        for (let i = 0; i < flightsPerRoute; i++) {
          // 현재 route에서 출발지와 도착지를 가져옴
          const departureAirport = route.departure;
          const arrivalAirport = route.arrival;
  
          // 항공사 선택 (경로에 따라 항공사 선택 로직 결정)
          let airline;
          
          // 한-일 노선일 경우 한국/일본 항공사만 선택
          if ((koreanAirports.some(ap => ap.code === departureAirport.code) && japaneseAirports.some(ap => ap.code === arrivalAirport.code)) ||
              (japaneseAirports.some(ap => ap.code === departureAirport.code) && koreanAirports.some(ap => ap.code === arrivalAirport.code))) {
            
            // 한국/일본 항공사만 선택 (0-7 인덱스: 한국, 7-10 인덱스: 일본 항공사)
            const airlineIndex = getRandomInt(0, 10);
            airline = airlines[airlineIndex];
          } 
          // 국내선
          else if (koreanAirports.some(ap => ap.code === departureAirport.code) && koreanAirports.some(ap => ap.code === arrivalAirport.code)) {
            // 한국 항공사만 선택 (0-7 인덱스)
            const airlineIndex = getRandomInt(0, 7);
            airline = airlines[airlineIndex];
          }
          // 기타 노선
          else {
            // 모든 항공사 대상
            const airlineIndex = getRandomInt(0, airlines.length);
            airline = airlines[airlineIndex];
          }
          
          // 항공편 번호 생성
          const flightNo = generateFlightNumber(airline.code);
          
          // 출발 시간 생성 - 시간대를 고르게 분포
          const departureHour = getRandomInt(0, 24);
          const departureMinute = getRandomInt(0, 60);
          const departureDateTime = moment(date)
            .hour(departureHour)
            .minute(departureMinute)
            .second(0);
          
          // 비행 시간 계산 (분 단위)
          const flightDuration = calculateFlightDuration(departureAirport.code, arrivalAirport.code);
          
          // 도착 시간 계산
          const arrivalDateTime = moment(departureDateTime).add(flightDuration, 'minutes');
          
          // 항공편 데이터 삽입
          await dbService.executeNonQuery(
            `INSERT INTO AIRPLANE (airline, flightNo, departureDateTime, arrivalDateTime, departureAirport, arrivalAirport) 
             VALUES (:1, :2, TO_TIMESTAMP(:3, 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP(:4, 'YYYY-MM-DD HH24:MI:SS'), :5, :6)`,
            [
              airline.name,
              flightNo,
              departureDateTime.format('YYYY-MM-DD HH:mm:ss'),
              arrivalDateTime.format('YYYY-MM-DD HH:mm:ss'),
              departureAirport.code,
              arrivalAirport.code
            ]
          );
          
          // 좌석 정보 생성
          // 항상 이코노미 클래스는 존재
          const economyPrice = calculatePrice(departureAirport.code, arrivalAirport.code, 'Economy');
          const economySeats = getRandomInt(150, 301); // 150-300석
          
          await dbService.executeNonQuery(
            `INSERT INTO SEATS (flightNo, departureDateTime, seatClass, price, no_of_seats) 
             VALUES (:1, TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'), :3, :4, :5)`,
            [
              flightNo,
              departureDateTime.format('YYYY-MM-DD HH:mm:ss'),
              'Economy',
              economyPrice,
              economySeats
            ]
          );
          
          // 비즈니스 클래스는 70% 확률로 존재
          if (Math.random() < 0.7) {
            const businessPrice = calculatePrice(departureAirport.code, arrivalAirport.code, 'Business');
            const businessSeats = getRandomInt(10, 51); // 10-50석
            
            await dbService.executeNonQuery(
              `INSERT INTO SEATS (flightNo, departureDateTime, seatClass, price, no_of_seats) 
               VALUES (:1, TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'), :3, :4, :5)`,
              [
                flightNo,
                departureDateTime.format('YYYY-MM-DD HH:mm:ss'),
                'Business',
                businessPrice,
                businessSeats
              ]
            );
          }
          
          totalFlightCount.count++;
          
          // 대량의 데이터를 생성할 때 로그 출력 제한
          if (totalFlightCount.count % 500 === 0) {
            logger.log(`${totalFlightCount.count}개의 항공편 데이터 생성 완료`);
          }
        }
      }
      
      logger.log(`${date.format('YYYY-MM-DD')} 날짜에 대한 항공편 생성 완료`);
    }
    
    logger.log(`총 ${totalFlightCount.count}개의 항공편과 좌석 데이터 생성 완료`);
    
    // 데이터베이스에 생성된 항공편 수 확인
    const countResult = await dbService.executeQuery<{COUNT: number}>(
      'SELECT COUNT(*) AS COUNT FROM AIRPLANE'
    );
    
    logger.log(`실제 저장된 항공편 수: ${countResult[0]?.COUNT || 0}개`);
    
  } catch (error) {
    logger.error(`데이터 생성 중 오류 발생: ${error.message}`, error.stack);
  } finally {
    // 데이터베이스 연결 정리
    await dbService.onModuleDestroy();
    await app.close();
    logger.log('애플리케이션 종료');
  }
}

bootstrap();
