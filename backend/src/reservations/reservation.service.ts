import { 
  Injectable, 
  Logger, 
  ConflictException, 
  NotFoundException, 
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import * as oracledb from 'oracledb';
import * as moment from 'moment';
import { DatabaseService } from '../database/database.service';
import { Reservation } from './reservation.interface';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservation.dto';
import { Utils } from '../utils/utils';

@Injectable()
export class ReservationService {
  private logger = new Logger(ReservationService.name);
  
  constructor(private dbService: DatabaseService) {}

  // DB 결과를 Reservation 객체로 매핑
  private mapToReservation(row: any): Reservation {
    return {
      flightNo: row.FLIGHTNO,
      departureDateTime: Utils.formatDate(row.DEPARTUREDATETIME),
      seatClass: row.SEATCLASS,
      payment: row.PAYMENT,
      reserveDateTime: Utils.formatDate(row.RESERVEDATETIME),
      cno: row.CNO,
    };
  }
  // 모든 예약 조회
  async findAll(): Promise<Reservation[]> {
    try {
      const sql = `SELECT * FROM RESERVE`;
      
      const rows = await this.dbService.executeQuery(sql, []);
      
      return rows.map(row => this.mapToReservation(row));
    } catch (error) {
      this.logger.error('Error in findAll reservations:', error);
      throw new InternalServerErrorException('예약 정보 조회 중 오류가 발생했습니다.');
    }
  }
  // 특정 예약 조회 (flightNo, departureDateTime, seatClass, cno 기준)
  async findOne(flightNo: string, departureDateTime: Date, seatClass: string, cno: string): Promise<Reservation | null> {
    try {
      const sql = `
        SELECT * FROM RESERVE 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS') 
        AND UPPER(SEATCLASS) = UPPER(:3) 
        AND CNO = :4
      `;
      
      const params = [
        flightNo,
        Utils.formatDateForDB(departureDateTime),
        seatClass,
        cno
      ];
      
      const rows = await this.dbService.executeQuery(sql, params);
      
      if (rows.length === 0) {
        return null;
      }
      
      return this.mapToReservation(rows[0]);
    } catch (error) {
      this.logger.error('Error in findOne reservation:', error);
      throw new InternalServerErrorException('예약 정보 조회 중 오류가 발생했습니다.');
    }
  }  // 사용자별 예약 조회 (날짜 필터링 지원)
  async findByCustomerId(cno: string, fromDate?: string, toDate?: string): Promise<Reservation[]> {
    try {
      let sql = `SELECT * FROM RESERVE WHERE CNO = :1`;
      const queryParams = [cno];
      let paramIndex = 2;
      
      // 시작 날짜 필터링 조건 추가
      if (fromDate) {
        sql += ` AND RESERVEDATETIME >= TO_TIMESTAMP(:${paramIndex}, 'YYYY-MM-DD HH24:MI:SS')`;
        queryParams.push(`${fromDate} 00:00:00`);
        paramIndex++;
      }
      
      // 종료 날짜 필터링 조건 추가
      if (toDate) {
        sql += ` AND RESERVEDATETIME <= TO_TIMESTAMP(:${paramIndex}, 'YYYY-MM-DD HH24:MI:SS')`;
        queryParams.push(`${toDate} 23:59:59`);
        paramIndex++;
      }
      
      // 항상 출발일시 기준으로 정렬
      sql += ` ORDER BY DEPARTUREDATETIME ASC`;
      
      const rows = await this.dbService.executeQuery(sql, queryParams);
      
      return rows.map(row => this.mapToReservation(row));
    } catch (error) {
      this.logger.error(`Error in findByCustomerId (${cno}):`, error);
      throw new InternalServerErrorException('사용자 예약 정보 조회 중 오류가 발생했습니다.');
    }
  }
    // 항공편별 예약 조회
  async findByFlight(flightNo: string, departureDateTime: Date): Promise<Reservation[]> {
    try {
      const sql = `
        SELECT * FROM RESERVE 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')
      `;
      
      const params = [
        flightNo,
        Utils.formatDateForDB(departureDateTime)
      ];
      
      const rows = await this.dbService.executeQuery(sql, params);
      
      return rows.map(row => this.mapToReservation(row));
    } catch (error) {
      this.logger.error(`Error in findByFlight (${flightNo}):`, error);
      throw new InternalServerErrorException('항공편 예약 정보 조회 중 오류가 발생했습니다.');
    }
  }
  
  // 예약 생성
  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    try {
      // 중복 예약 확인
      const checkSql = `
        SELECT COUNT(*) as COUNT FROM RESERVE 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')
        AND UPPER(SEATCLASS) = UPPER(:3) 
        AND CNO = :4
      `;
      const checkParams = [
        createReservationDto.flightNo,
        Utils.formatDateForDB(createReservationDto.departureDateTime),
        createReservationDto.seatClass,
        createReservationDto.cno
      ];
      const checkResult = await this.dbService.executeQuery<{"COUNT": number}>(checkSql, checkParams);
      if (checkResult[0]?.COUNT > 0) {
        throw new ConflictException('이미 동일한 예약이 존재합니다.');
      }
      // 좌석 가용성 확인
      const seatSql = `
        SELECT NO_OF_SEATS FROM SEATS 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS') 
        AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      const seatParams = [
        createReservationDto.flightNo,
        Utils.formatDateForDB(createReservationDto.departureDateTime),
        createReservationDto.seatClass
      ];
      const seatResult = await this.dbService.executeQuery<{NO_OF_SEATS: number}>(seatSql, seatParams);
      if (seatResult.length === 0) {
        throw new NotFoundException('해당 항공편의 좌석 정보를 찾을 수 없습니다.');
      }
      if (seatResult[0].NO_OF_SEATS <= 0) {
        throw new ConflictException('선택한 좌석 클래스에 예약 가능한 좌석이 없습니다.');
      }
      // 예약 생성
      const reserveDateTime = new Date();
      const insertSql = `
        INSERT INTO RESERVE (
          FLIGHTNO, DEPARTUREDATETIME, SEATCLASS, PAYMENT, RESERVEDATETIME, CNO
        ) VALUES (:1, TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'), :3, :4, TO_TIMESTAMP(:5, 'YYYY-MM-DD HH24:MI:SS'), :6)
      `;
      const insertParams = [
        createReservationDto.flightNo,
        Utils.formatDateForDB(createReservationDto.departureDateTime),
        createReservationDto.seatClass,
        createReservationDto.payment,
        Utils.formatDateForDB(reserveDateTime),
        createReservationDto.cno
      ];

      this.logger.log(`Insert SQL: ${insertSql}`);
      this.logger.log(`Insert Params: ${JSON.stringify(insertParams)}`);
      await this.dbService.executeNonQuery(insertSql, insertParams);
      // 좌석 수 감소
      const updateSeatSql = `
        UPDATE SEATS 
        SET NO_OF_SEATS = NO_OF_SEATS - 1 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS') 
        AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      await this.dbService.executeNonQuery(updateSeatSql, seatParams);
      const reservation: Reservation = {
        flightNo: createReservationDto.flightNo,
        departureDateTime: Utils.formatDate(createReservationDto.departureDateTime),
        seatClass: createReservationDto.seatClass,
        payment: createReservationDto.payment,
        reserveDateTime: Utils.formatDate(reserveDateTime),
        cno: createReservationDto.cno
      };
      return reservation;
    } catch (error) {
      this.logger.error('Error in create reservation:', error);
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('예약 생성 중 오류가 발생했습니다.');
    }
  }
  // 예약 삭제
  async delete(flightNo: string, departureDateTime: Date, seatClass: string, cno: string): Promise<boolean> {
    try {
      // 예약 존재 확인
      const checkSql = `
        SELECT * FROM RESERVE 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS') 
        AND UPPER(SEATCLASS) = UPPER(:3) 
        AND CNO = :4
      `;
      const checkParams = [
        flightNo,
        Utils.formatDateForDB(departureDateTime),
        seatClass,
        cno
      ];
      const checkResult = await this.dbService.executeQuery(checkSql, checkParams);
      if (checkResult.length === 0) {
        throw new NotFoundException('예약 정보를 찾을 수 없습니다.');
      }
      // 예약 삭제
      const deleteSql = `
        DELETE FROM RESERVE 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS') 
        AND UPPER(SEATCLASS) = UPPER(:3) 
        AND CNO = :4
      `;
      const rowsAffected = await this.dbService.executeNonQuery(deleteSql, checkParams);
      // 좌석 수 증가
      const updateSeatSql = `
        UPDATE SEATS 
        SET NO_OF_SEATS = NO_OF_SEATS + 1 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS') 
        AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      const seatParams = [flightNo, Utils.formatDateForDB(departureDateTime), seatClass];
      await this.dbService.executeNonQuery(updateSeatSql, seatParams);
      return rowsAffected > 0;
    } catch (error) {
      this.logger.error('Error in delete reservation:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('예약 삭제 중 오류가 발생했습니다.');
    }
  }
}
