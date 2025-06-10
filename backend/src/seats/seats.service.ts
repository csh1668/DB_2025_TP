import { 
  Injectable, 
  Logger, 
  ConflictException, 
  InternalServerErrorException,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import * as oracledb from 'oracledb';
import { DatabaseService } from '../database/database.service';
import { Seat } from './seats.interface';
import { CreateSeatDto, UpdateSeatDto } from './dto/seat.dto';
import { AirplaneService } from '../airplanes/airplane.service';
import * as moment from 'moment-timezone';

@Injectable()
export class SeatsService {
  private logger = new Logger(SeatsService.name);

  constructor(private dbService: DatabaseService,
              private airplaneService: AirplaneService
  ) {}
  
  // UTC 날짜를 한국 시간(KST)으로 변환
  private formatDateToKST(date: Date): Date {
    if (!date) return null;
    return moment(date).add(9, 'hours').toDate();
  }

  // 날짜를 DB에 저장하기 위한 형식으로 변환
  private formatDateForDB(date: Date): string {
    if (!date) return null;
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  }

  // DB 결과를 Seat 객체로 매핑
  private mapToSeat(row: any): Seat {
    return {
      flightNo: row.FLIGHTNO,
      departureDateTime: this.formatDateToKST(row.DEPARTUREDATETIME),
      seatClass: row.SEATCLASS,
      price: row.PRICE,
      no_of_seats: row.NO_OF_SEATS,
    };
  }
  
  // 모든 좌석 조회
  async findAll(
    flightNo?: string,
    departureDateTime?: Date,
    seatClass?: string
  ): Promise<Seat[]> {
    try {
      let query = `
        SELECT *
        FROM SEATS
        WHERE 1=1
      `;
      
      const params = [];
      let bindIndex = 1;
      
      if (flightNo) {
        query += ` AND FLIGHTNO = :${bindIndex}`;
        params.push(flightNo);
        bindIndex++;
      }
      
      if (departureDateTime) {
        query += ` AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:${bindIndex}, 'YYYY-MM-DD HH24:MI:SS'))`;
        params.push(this.formatDateForDB(departureDateTime));
        bindIndex++;
      }
      
      if (seatClass) {
        query += ` AND UPPER(SEATCLASS) = UPPER(:${bindIndex})`;
        params.push(seatClass);
        bindIndex++;
      }
      
      query += ' ORDER BY FLIGHTNO, DEPARTUREDATETIME, SEATCLASS';
      
      const rows = await this.dbService.executeQuery(query, params);
      
      const seats = rows.map(row => this.mapToSeat(row));
      
      return seats;
    } catch (error) {
      this.logger.error(`좌석 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('좌석 정보를 조회하는 중 오류가 발생했습니다.');
    }
  }

  // 특정 항공편의 좌석 정보 조회
  async findByFlightInfo(flightNo: string, dateStr: string): Promise<Seat[]> {
    try {
      const query = `
        SELECT *
        FROM SEATS
        WHERE FLIGHTNO = :1 
          AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')
        ORDER BY SEATCLASS
      `;
      
      const params = [
        flightNo,
        dateStr
      ];

      this.logger.log(`항공편 좌석 조회 쿼리: ${query} | 파라미터: ${JSON.stringify(params)}`);
      
      const seats = await this.dbService.executeQuery<Seat>(query, params)
        .then(rows => rows.map(row => this.mapToSeat(row)));
      
      return seats;
    } catch (error) {
      this.logger.error(`항공편 좌석 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('항공편 좌석 정보를 조회하는 중 오류가 발생했습니다.');
    }
  }

  // 특정 좌석 클래스 조회
  async findBySeatClass(flightNo: string, departureDateTime: Date, seatClass: string): Promise<Seat> {
    try {
      const query = `
        SELECT *
        FROM SEATS
        WHERE FLIGHTNO = :1 
          AND DEPARTUREDATETIME = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')
          AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      
      const params = [
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      const rows = await this.dbService.executeQuery<any>(query, params);
      
      if (rows.length === 0) {
        throw new NotFoundException(`해당 항공편(${flightNo})의 ${seatClass} 클래스 좌석을 찾을 수 없습니다.`);
      }
      
      return this.mapToSeat(rows[0]);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`좌석 클래스 조회 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('좌석 클래스 정보를 조회하는 중 오류가 발생했습니다.');
    }
  }

  // 좌석 추가
  async create(createSeatDto: CreateSeatDto): Promise<Seat> {
    try {
      const { flightNo, departureDateTime, seatClass, price, no_of_seats } = createSeatDto;
      const parsedDepartureDateTime = moment(departureDateTime).toDate();
      
      // 해당 항공편이 존재하는지 확인
      const airplane = await this.airplaneService.findByKey(flightNo, parsedDepartureDateTime);
      if (!airplane) {
        throw new NotFoundException(`항공편 ${flightNo}(${parsedDepartureDateTime})을 찾을 수 없습니다.`);
      }
      
      // 이미 같은 좌석 클래스가 있는지 확인
      const checkSeatQuery = `
        SELECT COUNT(*) AS count
        FROM SEATS
        WHERE FLIGHTNO = :1 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      
      const count = await this.dbService.executeQuery<Record<string, number>>(checkSeatQuery, [
        flightNo,
        this.formatDateForDB(parsedDepartureDateTime),
        seatClass
      ]).then(rows => rows[0].COUNT);
      
      if (count > 0) {
        throw new ConflictException(`이미 해당 항공편(${flightNo})의 ${seatClass} 클래스 좌석이 등록되어 있습니다.`);
      }
      
      // 좌석 추가
      const insertQuery = `
        INSERT INTO SEATS(FLIGHTNO, DEPARTUREDATETIME, SEATCLASS, PRICE, NO_OF_SEATS)
        VALUES (:1, TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'), :3, :4, :5)
      `;
      
      const res = await this.dbService.executeNonQuery(insertQuery, [
        flightNo,
        this.formatDateForDB(parsedDepartureDateTime),
        seatClass,
        price,
        no_of_seats
      ]);

      if (res === 0) throw new InternalServerErrorException('좌석 정보를 추가하는 중 오류가 발생했습니다.');
      
      return {
        flightNo,
        departureDateTime: parsedDepartureDateTime,
        seatClass,
        price,
        no_of_seats
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`좌석 추가 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('좌석 정보를 추가하는 중 오류가 발생했습니다.');
    }
  }

  // 좌석 정보 업데이트
  async update(flightNo: string, departureDateTime: Date, seatClass: string, updateSeatDto: UpdateSeatDto): Promise<Seat> {
    try {
      const { price, no_of_seats } = updateSeatDto;
      
      // 해당 좌석이 존재하는지 확인
      const check = await this.findBySeatClass(flightNo, departureDateTime, seatClass);
      if (!check) {
        throw new NotFoundException(`해당 항공편(${flightNo})의 ${seatClass} 클래스 좌석을 찾을 수 없습니다.`);
      }
      
      // 좌석 정보 업데이트
      const updateQuery = `
        UPDATE SEATS
        SET PRICE = :1, NO_OF_SEATS = :2
        WHERE FLIGHTNO = :3 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:4, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:5)
      `;

      const updateParams = [
        price,
        no_of_seats,
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      const rowsAffected = await this.dbService.executeNonQuery(updateQuery, updateParams);
      
      if (rowsAffected === 0) {
        throw new NotFoundException(`해당 항공편(${flightNo})의 ${seatClass} 클래스 좌석을 찾을 수 없습니다.`);
      }
      
      return {
        flightNo,
        departureDateTime,
        seatClass,
        price,
        no_of_seats
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`좌석 업데이트 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('좌석 정보를 업데이트하는 중 오류가 발생했습니다.');
    }
  }
  
  // 좌석 삭제
  async delete(flightNo: string, departureDateTime: Date, seatClass: string): Promise<void> {
    try {
      // 해당 좌석에 대한 예약이 있는지 확인
      const checkReservationQuery = `
        SELECT COUNT(*) AS count
        FROM RESERVE
        WHERE FLIGHTNO = :1 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      
      const checkParams = [
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      const reservations = await this.dbService.executeQuery<{ COUNT: number }>(checkReservationQuery, checkParams);
      
      if (reservations[0]?.COUNT > 0) {
        throw new ConflictException(`해당 좌석에 대한 예약이 존재하여 삭제할 수 없습니다.`);
      }
      
      // 좌석 삭제
      const deleteQuery = `
        DELETE FROM SEATS
        WHERE FLIGHTNO = :1 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      
      const deleteParams = [
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      const rowsAffected = await this.dbService.executeNonQuery(deleteQuery, deleteParams);
      
      if (rowsAffected === 0) {
        throw new NotFoundException(`해당 항공편(${flightNo})의 ${seatClass} 클래스 좌석을 찾을 수 없습니다.`);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`좌석 삭제 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('좌석 정보를 삭제하는 중 오류가 발생했습니다.');
    }
  }
  
  // 좌석 수 감소 (예약 시)
  async decreaseSeatCount(flightNo: string, departureDateTime: Date, seatClass: string, count: number): Promise<void> {
    try {
      // 현재 남은 좌석 수 확인
      const checkSeatQuery = `
        SELECT NO_OF_SEATS
        FROM SEATS
        WHERE FLIGHTNO = :1 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      
      const checkParams = [
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      const seatRows = await this.dbService.executeQuery<any>(checkSeatQuery, checkParams);
      
      if (seatRows.length === 0) {
        throw new NotFoundException(`해당 항공편(${flightNo})의 ${seatClass} 클래스 좌석을 찾을 수 없습니다.`);
      }
      
      const currentSeats = seatRows[0].NO_OF_SEATS;
      if (currentSeats < count) {
        throw new BadRequestException(`좌석 수가 부족합니다. (현재 남은 좌석: ${currentSeats})`);
      }
      
      // 좌석 수 감소
      const updateQuery = `
        UPDATE SEATS
        SET NO_OF_SEATS = NO_OF_SEATS - :1
        WHERE FLIGHTNO = :2 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:3, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:4)
      `;
      
      const updateParams = [
        count,
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      await this.dbService.executeNonQuery(updateQuery, updateParams);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`좌석 수 감소 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('좌석 수를 감소시키는 중 오류가 발생했습니다.');
    }
  }
  
  // 좌석 수 증가 (예약 취소 시)
  async increaseSeatCount(flightNo: string, departureDateTime: Date, seatClass: string, count: number): Promise<void> {
    try {
      // 좌석 존재 여부 확인
      const checkSeatQuery = `
        SELECT COUNT(*) AS COUNT
        FROM SEATS
        WHERE FLIGHTNO = :1 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:3)
      `;
      
      const checkParams = [
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      const rows = await this.dbService.executeQuery<{ COUNT: number }>(checkSeatQuery, checkParams);
      
      if (rows[0].COUNT === 0) {
        throw new NotFoundException(`해당 항공편(${flightNo})의 ${seatClass} 클래스 좌석을 찾을 수 없습니다.`);
      }
      
      // 좌석 수 증가
      const updateQuery = `
        UPDATE SEATS
        SET NO_OF_SEATS = NO_OF_SEATS + :1
        WHERE FLIGHTNO = :2 
          AND TRUNC(DEPARTUREDATETIME) = TRUNC(TO_TIMESTAMP(:3, 'YYYY-MM-DD HH24:MI:SS'))
          AND UPPER(SEATCLASS) = UPPER(:4)
      `;
      
      const updateParams = [
        count,
        flightNo,
        this.formatDateForDB(departureDateTime),
        seatClass
      ];
      
      await this.dbService.executeNonQuery(updateQuery, updateParams);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`좌석 수 증가 중 오류 발생: ${error.message}`);
      throw new InternalServerErrorException('좌석 수를 증가시키는 중 오류가 발생했습니다.');
    }
  }
}
