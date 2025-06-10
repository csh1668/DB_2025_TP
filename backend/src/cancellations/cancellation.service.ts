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
import { Cancellation } from './cancellation.interface';
import { CreateCancellationDto } from './dto/cancellation.dto';
import { Utils } from '../utils/utils';

@Injectable()
export class CancellationService {
  private logger = new Logger(CancellationService.name);
  
  constructor(private dbService: DatabaseService) {}

  // DB 결과를 Cancellation 객체로 매핑
  private mapToCancellation(row: any): Cancellation {
    return {
      flightNo: row.FLIGHTNO,
      departureDateTime: Utils.formatDate(row.DEPARTUREDATETIME),
      seatClass: row.SEATCLASS,
      refund: row.REFUND,
      cancelDateTime: Utils.formatDate(row.CANCELDATETIME),
      cno: row.CNO,
    };
  }

  // 모든 취소 조회
  async findAll(): Promise<Cancellation[]> {
    try {
      const sql = `SELECT * FROM CANCEL`;
      const rows = await this.dbService.executeQuery(sql, []);
      return rows.map(row => this.mapToCancellation(row));
    } catch (error) {
      this.logger.error('Error in findAll cancellations:', error);
      throw new InternalServerErrorException('취소 정보 조회 중 오류가 발생했습니다.');
    }
  }

  // 특정 취소 조회
  async findOne(flightNo: string, departureDateTime: Date, seatClass: string, cno: string): Promise<Cancellation | null> {
    try {
      const sql = `
        SELECT * FROM CANCEL 
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
      return this.mapToCancellation(rows[0]);
    } catch (error) {
      this.logger.error('Error in findOne cancellation:', error);
      throw new InternalServerErrorException('취소 정보 조회 중 오류가 발생했습니다.');
    }
  }  // 사용자별 취소 조회
  async findByCustomerId(cno: string, fromDate?: string, toDate?: string): Promise<Cancellation[]> {
    try {
      let sql = `SELECT * FROM CANCEL WHERE CNO = :1`;
      const queryParams = [cno];
      let paramIndex = 2;
      
      // 시작 날짜 필터링 조건 추가
      if (fromDate) {
        sql += ` AND CANCELDATETIME >= TO_TIMESTAMP(:${paramIndex}, 'YYYY-MM-DD HH24:MI:SS')`;
        queryParams.push(`${fromDate} 00:00:00`);
        paramIndex++;
      }
      
      // 종료 날짜 필터링 조건 추가
      if (toDate) {
        sql += ` AND CANCELDATETIME <= TO_TIMESTAMP(:${paramIndex}, 'YYYY-MM-DD HH24:MI:SS')`;
        queryParams.push(`${toDate} 23:59:59`);
        paramIndex++;
      }
      
      sql += ` ORDER BY CANCELDATETIME DESC`;
      const rows = await this.dbService.executeQuery(sql, queryParams);
      return rows.map(row => this.mapToCancellation(row));
    } catch (error) {
      this.logger.error(`Error in findByCustomerId (${cno}):`, error);
      throw new InternalServerErrorException('사용자 취소 정보 조회 중 오류가 발생했습니다.');
    }
  }

  // 항공편별 취소 조회
  async findByFlight(flightNo: string, departureDateTime: Date): Promise<Cancellation[]> {
    try {
      const sql = `
        SELECT * FROM CANCEL 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS') 
      `;
      const params = [
        flightNo,
        Utils.formatDateForDB(departureDateTime)
      ];
      const rows = await this.dbService.executeQuery(sql, params);
      return rows.map(row => this.mapToCancellation(row));
    } catch (error) {
      this.logger.error(`Error in findByFlight (${flightNo}):`, error);
      throw new InternalServerErrorException('항공편 취소 정보 조회 중 오류가 발생했습니다.');
    }
  }

  // 취소 생성 (예약 취소)
  async create(createCancellationDto: CreateCancellationDto): Promise<Cancellation> {
    try {
      // 예약 정보 확인
      const checkReserveSql = `
        SELECT * FROM RESERVE 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')  
        AND UPPER(SEATCLASS) = UPPER(:3) 
        AND CNO = :4
      `;
      const reserveParams = [
        createCancellationDto.flightNo,
        Utils.formatDateForDB(createCancellationDto.departureDateTime),
        createCancellationDto.seatClass,
        createCancellationDto.cno
      ];
      const reserveResult = await this.dbService.executeQuery(checkReserveSql, reserveParams);
      if (reserveResult.length === 0) {
        throw new NotFoundException('취소할 예약을 찾을 수 없습니다.');
      }
      // 이미 취소된 예약인지 확인
      const checkCancelSql = `
        SELECT COUNT(*) as COUNT FROM CANCEL 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')  
        AND UPPER(SEATCLASS) = UPPER(:3) 
        AND CNO = :4
      `;
      const checkCancelResult = await this.dbService.executeQuery<{COUNT: number}>(checkCancelSql, reserveParams);
      if (checkCancelResult[0]?.COUNT > 0) {
        throw new ConflictException('이미 취소된 예약입니다.');
      }
      // 취소 정보 생성
      const cancelDateTime = new Date();
      const insertSql = `
        INSERT INTO CANCEL (
          FLIGHTNO, DEPARTUREDATETIME, SEATCLASS, REFUND, CANCELDATETIME, CNO
        ) VALUES (:1, TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'), :3, :4, TO_TIMESTAMP(:5, 'YYYY-MM-DD HH24:MI:SS') , :6)
      `;
      const insertParams = [
        createCancellationDto.flightNo,
        Utils.formatDateForDB(createCancellationDto.departureDateTime),
        createCancellationDto.seatClass,
        createCancellationDto.refund,
        Utils.formatDateForDB(cancelDateTime),
        createCancellationDto.cno
      ];

      this.logger.log(`Insert SQL: ${insertSql}`);
      this.logger.log(`Insert Params: ${JSON.stringify(insertParams)}`);
      await this.dbService.executeNonQuery(insertSql, insertParams);
      // 예약 테이블에서 삭제
      const deleteSql = `
        DELETE FROM RESERVE 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')  
        AND UPPER(SEATCLASS) = UPPER(:3) 
        AND CNO = :4
      `;
      await this.dbService.executeNonQuery(deleteSql, reserveParams);
      // 좌석 수 증가
      const updateSeatsSql = `
        UPDATE SEATS 
        SET NO_OF_SEATS = NO_OF_SEATS + 1 
        WHERE FLIGHTNO = :1 
        AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')  
        AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      const seatParams = [
        createCancellationDto.flightNo,
        Utils.formatDateForDB(createCancellationDto.departureDateTime),
        createCancellationDto.seatClass
      ];
      await this.dbService.executeNonQuery(updateSeatsSql, seatParams);
      const cancellation: Cancellation = {
        flightNo: createCancellationDto.flightNo,
        departureDateTime: Utils.formatDate(createCancellationDto.departureDateTime),
        seatClass: createCancellationDto.seatClass,
        refund: createCancellationDto.refund,
        cancelDateTime: Utils.formatDate(cancelDateTime),
        cno: createCancellationDto.cno
      };
      return cancellation;
    } catch (error) {
      this.logger.error('Error in create cancellation:', error);
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('예약 취소 처리 중 오류가 발생했습니다.');
    }
  }
}
