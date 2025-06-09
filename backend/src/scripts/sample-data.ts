import * as oracledb from 'oracledb';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

// 환경 변수 로드
dotenv.config();

const logger = new Logger('SampleData');

async function insertSampleData() {
  let connection;

  try {
    // Oracle 클라이언트 초기화
    oracledb.initOracleClient();
    
    // 연결 생성
    connection = await oracledb.getConnection({
      user: process.env.DB_USERNAME || 'system',
      password: process.env.DB_PASSWORD || 'oracle',
      connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${process.env.DB_HOST || 'localhost'})(PORT=${process.env.DB_PORT || 1521}))(CONNECT_DATA=(SERVICE_NAME=${process.env.DB_SERVICE_NAME || 'xe'})))`
    });
    
    logger.log('데이터베이스 연결 성공');
    
    // 항공사 샘플 데이터
    const airlines = [
      { airline: 'KAL', flightNo: 'KE123', departureDateTime: new Date('2025-07-01T10:00:00'), 
        arrivalDateTime: new Date('2025-07-01T12:00:00'), 
        departureAirport: 'ICN', arrivalAirport: 'CJU' },
      { airline: 'AAR', flightNo: 'OZ456', departureDateTime: new Date('2025-07-02T14:30:00'), 
        arrivalDateTime: new Date('2025-07-02T16:00:00'), 
        departureAirport: 'GMP', arrivalAirport: 'PUS' },
      { airline: 'JEJ', flightNo: '7C789', departureDateTime: new Date('2025-07-03T09:15:00'), 
        arrivalDateTime: new Date('2025-07-03T10:30:00'), 
        departureAirport: 'CJU', arrivalAirport: 'ICN' },
    ];
    
    // 항공사 데이터 삽입
    for (const airline of airlines) {
      try {
        await connection.execute(
          `INSERT INTO AIRPLANE (airline, flightNo, departureDateTime, arrivalDateTime, departureAirport, arrivalAirport) 
           VALUES (:1, :2, :3, :4, :5, :6)`,
          [
            airline.airline,
            airline.flightNo,
            airline.departureDateTime,
            airline.arrivalDateTime,
            airline.departureAirport,
            airline.arrivalAirport
          ],
          { autoCommit: false }
        );
        logger.log(`항공편 데이터 삽입 성공: ${airline.airline} ${airline.flightNo}`);
      } catch (err) {
        logger.error(`항공편 데이터 삽입 실패: ${airline.flightNo}`);
        logger.error(err.message);
      }
    }
    
    // 좌석 데이터
    const seatsData = [];
    for (const airline of airlines) {
      seatsData.push({
        flightNo: airline.flightNo,
        departureDateTime: airline.departureDateTime,
        seatClass: 'FIRST',
        price: 500000,
        no_of_seats: 10
      });
      seatsData.push({
        flightNo: airline.flightNo,
        departureDateTime: airline.departureDateTime,
        seatClass: 'BUSINESS',
        price: 300000,
        no_of_seats: 30
      });
      seatsData.push({
        flightNo: airline.flightNo,
        departureDateTime: airline.departureDateTime,
        seatClass: 'ECONOMY',
        price: 100000,
        no_of_seats: 160
      });
    }
    
    // 좌석 데이터 삽입
    for (const seat of seatsData) {
      try {
        await connection.execute(
          `INSERT INTO SEATS (flightNo, departureDateTime, seatClass, price, no_of_seats) 
           VALUES (:1, :2, :3, :4, :5)`,
          [
            seat.flightNo,
            seat.departureDateTime,
            seat.seatClass,
            seat.price,
            seat.no_of_seats
          ],
          { autoCommit: false }
        );
        logger.log(`좌석 데이터 삽입 성공: ${seat.flightNo} ${seat.seatClass}`);
      } catch (err) {
        logger.error(`좌석 데이터 삽입 실패: ${seat.flightNo} ${seat.seatClass}`);
        logger.error(err.message);
      }
    }
    
    // 고객 데이터
    const customers = [
      { cno: 'C001', name: '홍길동', passwd: 'pass123', email: 'hong@example.com', passportNumber: 'M12345678' },
      { cno: 'C002', name: '김철수', passwd: 'pass456', email: 'kim@example.com', passportNumber: 'M87654321' },
      { cno: 'C003', name: '이영희', passwd: 'pass789', email: 'lee@example.com', passportNumber: 'F12312312' },
    ];
    
    // 고객 데이터 삽입
    for (const customer of customers) {
      try {
        await connection.execute(
          `INSERT INTO CUSTOMER (cno, name, passwd, email, passportNumber) 
           VALUES (:1, :2, :3, :4, :5)`,
          [
            customer.cno,
            customer.name,
            customer.passwd,
            customer.email,
            customer.passportNumber
          ],
          { autoCommit: false }
        );
        logger.log(`고객 데이터 삽입 성공: ${customer.name}`);
      } catch (err) {
        logger.error(`고객 데이터 삽입 실패: ${customer.name}`);
        logger.error(err.message);
      }
    }
    
    // 모든 변경사항 커밋
    await connection.commit();
    logger.log('모든 샘플 데이터가 성공적으로 추가되었습니다.');
    
  } catch (err) {
    if (connection) {
      try {
        // 오류 발생 시 롤백
        await connection.rollback();
        logger.error('트랜잭션이 롤백되었습니다.');
      } catch (rollbackErr) {
        logger.error('롤백 중 오류가 발생했습니다.');
        logger.error(rollbackErr.message);
      }
    }
    logger.error('샘플 데이터 추가 중 오류 발생');
    logger.error(err.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logger.error('연결 종료 오류');
        logger.error(err.message);
      }
    }
  }
}

insertSampleData();
