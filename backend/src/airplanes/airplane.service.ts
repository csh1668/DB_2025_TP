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
import { Airplane } from './airplane.interface';
import { CreateAirplaneDto, UpdateAirplaneDto } from './dto/airplane.dto';
import * as moment from 'moment-timezone';
import { Utils } from '../utils/utils';

@Injectable()
export class AirplaneService {
  private logger = new Logger(AirplaneService.name);

  constructor(private dbService: DatabaseService) {}

  // 날짜를 DB에 저장하기 위한 형식으로 변환
  private formatDateForDB(date: Date | string): string {
    if (!date) return null;
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  }

  private mapToFlight(row: any): Airplane {
    return {
      airline: row.AIRLINE,
      flightNo: row.FLIGHTNO,
      departureDateTime: Utils.formatDate(row.DEPARTUREDATETIME),
      arrivalDateTime: Utils.formatDate(row.ARRIVALDATETIME),
      departureAirport: row.DEPARTUREAIRPORT,
      arrivalAirport: row.ARRIVALAIRPORT,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'departureDateTime',
    departureAirport?: string,
    arrivalAirport?: string,
    departureDate?: Date,
  ): Promise<{ airplanes: Airplane[]; total: number }> {
    const dateStr = departureDate ? moment(departureDate).format('YYYY-MM-DD') : undefined;

    this.logger.log(`findAll: page=${page}, limit=${limit}, sortBy=${sortBy}, departureAirport=${departureAirport}, arrivalAirport=${arrivalAirport}, departureDate=${dateStr}`);

    const offset = (page - 1) * limit;

    const order = sortBy.startsWith('-') ? 'DESC' : 'ASC';
    sortBy = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;

    const params: any[] = [];

    const where = [];
    if (departureAirport) {
      params.push(departureAirport);
      where.push(`departureAirport = :${params.length}`);
    }
    if (arrivalAirport) {
      params.push(arrivalAirport);
      where.push(`arrivalAirport = :${params.length}`);
    }
    if (dateStr) {
      params.push(dateStr); // YYYY-MM-DD 형식으로 변환
      console.log(`${dateStr}`)
      where.push(`TRUNC(departureDateTime) = TRUNC(TO_TIMESTAMP(:${params.length}, 'YYYY-MM-DD'))`);
    }


    const countSql = `SELECT COUNT(*) as total FROM AIRPLANE ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''}`;

    const countResult = await this.dbService.executeQuery<Record<string, number>>(countSql, params);
    const total = countResult[0]?.['TOTAL'] || 0;

    const sql = `
      SELECT airline, flightNo, departureDateTime, arrivalDateTime, departureAirport, arrivalAirport
      FROM (
        SELECT a.*, ROWNUM as rnum
        FROM (
          SELECT airline, flightNo, departureDateTime, arrivalDateTime, departureAirport, arrivalAirport
          FROM AIRPLANE
          ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''}
          ORDER BY ${sortBy} ${order}
        ) a
        WHERE ROWNUM <= :${params.length + 1}
      )
      WHERE rnum > :${params.length + 2}
    `;
    
    params.push(offset + limit, offset);
      const airplanes = await this.dbService.executeQuery<Airplane>(sql, params)
      .then((rows) => rows.map(row => this.mapToFlight(row)));

    this.logger.log(`Found ${airplanes.length} airplanes on page ${page}`);
    
    return { airplanes, total };
  }

  async findByKey(
    flightNo: string,
    departureDateTime: Date,
  ) : Promise<Airplane | null> {
    this.logger.log(`Finding airplane by key: flightNo=${flightNo}, departureDateTime=${departureDateTime}`);
    const sql = `
      SELECT airline, flightNo, departureDateTime, arrivalDateTime, departureAirport, arrivalAirport
      FROM AIRPLANE
      WHERE flightNo = :1 AND departureDateTime = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI:SS')
    `;

    const formattedDate = this.formatDateForDB(departureDateTime);
    const params = [flightNo, formattedDate];
    const result = await this.dbService.executeQuery<Airplane>(sql, params)
      .then((rows) => rows.map(row => this.mapToFlight(row)));
    
    return result.length > 0 ? result[0] : null;
  }

  async findByFlightNo(flightNo: string) : Promise<Airplane> {
    this.logger.log(`Finding airplanes by flightNo: ${flightNo}`);
    const sql = `
      SELECT airline, flightNo, departureDateTime, arrivalDateTime, departureAirport, arrivalAirport
      FROM AIRPLANE
      WHERE flightNo = :1
    `;

    return this.dbService.executeQuery<Airplane>(sql, [flightNo])
      .then((rows) => rows.map(row => this.mapToFlight(row))).then((result) => {
        return result.length > 0 ? result[0] : null;
      });
  }

  async create(createAirplaneDto: CreateAirplaneDto): Promise<Airplane> {
    try {
      // 중복 항공편 확인
      const existingFlight = await this.findByKey(
        createAirplaneDto.flightNo, 
        new Date(createAirplaneDto.departureDateTime)
      );
      
      if (existingFlight) {
        throw new ConflictException(
          `항공편 ${createAirplaneDto.flightNo}(${createAirplaneDto.departureDateTime})는 이미 존재합니다.`
        );
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`항공편 정보 검증 오류: ${error.message}`);
      throw new InternalServerErrorException(
        '항공편 정보를 확인하는 중 오류가 발생했습니다.'
      );
    }
    const departureDate = moment(createAirplaneDto.departureDateTime).toDate();
    const arrivalDate = moment(createAirplaneDto.arrivalDateTime).toDate();

    // 도착 시간이 출발 시간보다 이후인지 확인
    if (moment(arrivalDate).isSameOrBefore(departureDate)) {
      throw new BadRequestException(
        '도착 시간은 출발 시간보다 이후여야 합니다.'
      );
    }

    const airplane: Airplane = {
      airline: createAirplaneDto.airline,
      flightNo: createAirplaneDto.flightNo,
      departureDateTime: Utils.formatDate(departureDate),
      arrivalDateTime: Utils.formatDate(arrivalDate),
      departureAirport: createAirplaneDto.departureAirport,
      arrivalAirport: createAirplaneDto.arrivalAirport
    };

    const sql = `
      INSERT INTO AIRPLANE (airline, flightNo, departureDateTime, arrivalDateTime, departureAirport, arrivalAirport) 
      VALUES (:1, :2, :3, :4, :5, :6)
    `;

    let connection: oracledb.Connection;
    try {
      connection = await oracledb.getConnection();
      try {        await connection.execute(
          sql,
          [
            airplane.airline,
            airplane.flightNo,
            this.formatDateForDB(airplane.departureDateTime),
            this.formatDateForDB(airplane.arrivalDateTime),
            airplane.departureAirport,
            airplane.arrivalAirport
          ],
          { autoCommit: true },
        );

        return airplane;
      } catch (dbError) {
        this.logger.error(`데이터베이스 오류: ${dbError.message}`);
        if (dbError.message.includes('unique constraint')) {
          throw new ConflictException(
            '중복된 항공편이 존재합니다.'
          );
        }
        throw new InternalServerErrorException(
          '항공편 등록 중 오류가 발생했습니다.'
        );
      }
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`데이터베이스 연결 오류: ${error.message}`);
      throw new InternalServerErrorException(
        '데이터베이스 연결 중 오류가 발생했습니다.'
      );
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('연결 종료 오류:', err);
        }
      }
    }
  }

  async update(
    flightNo: string,
    departureDateTime: Date,
    updateAirplaneDto: UpdateAirplaneDto
  ): Promise<number> {
    // 업데이트할 필드가 없는 경우 오류 처리
    if (Object.keys(updateAirplaneDto).length === 0) {
      throw new BadRequestException('수정할 정보가 없습니다.');
    }

    // 항공편이 존재하는지 확인
    const existingFlight = await this.findByKey(flightNo, departureDateTime);
    if (!existingFlight) {
      throw new NotFoundException(
        `항공편 ${flightNo}(${departureDateTime})이 존재하지 않습니다.`
      );
    }

    let sql = 'UPDATE AIRPLANE SET ';
    const params = [];
    const updateFields = [];
    let paramIndex = 1;

    if (updateAirplaneDto.airline !== undefined) {
      updateFields.push(`airline = :${paramIndex}`);
      params.push(updateAirplaneDto.airline);
      paramIndex++;
    }    if (updateAirplaneDto.arrivalDateTime !== undefined) {
      const newArrivalDate = moment(updateAirplaneDto.arrivalDateTime).toDate();
      if (moment(newArrivalDate).isSameOrBefore(moment(departureDateTime))) {
        throw new BadRequestException(
          '도착 시간은 출발 시간보다 이후여야 합니다.'
        );
      }
      updateFields.push(`arrivalDateTime = :${paramIndex}`);
      params.push(newArrivalDate);
      paramIndex++;
    }

    if (updateAirplaneDto.departureAirport !== undefined) {
      updateFields.push(`departureAirport = :${paramIndex}`);
      params.push(updateAirplaneDto.departureAirport);
      paramIndex++;
    }

    if (updateAirplaneDto.arrivalAirport !== undefined) {
      updateFields.push(`arrivalAirport = :${paramIndex}`);
      params.push(updateAirplaneDto.arrivalAirport);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new BadRequestException('수정할 유효한 정보가 없습니다.');
    }    sql += updateFields.join(', ');
    sql += ` WHERE flightNo = :${paramIndex} AND TRUNC(departureDateTime) = TRUNC(TO_TIMESTAMP(:${paramIndex + 1}, 'YYYY-MM-DD HH24:MI:SS'))`;
    params.push(flightNo, this.formatDateForDB(departureDateTime));

    try {
      const result = await this.dbService.executeNonQuery(sql, params);
      if (result === 0) {
        throw new NotFoundException(
          `업데이트 실패: 항공편 ${flightNo}(${departureDateTime})이 존재하지 않습니다.`
        );
      }
      return result;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`항공편 업데이트 오류: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '항공편 정보 업데이트 중 오류가 발생했습니다.'
      );
    }
  }

  async delete(flightNo: string, departureDateTime: Date): Promise<number> {
    // 항공편이 존재하는지 확인
    const existingFlight = await this.findByKey(flightNo, departureDateTime);
    if (!existingFlight) {
      throw new NotFoundException(
        `항공편 ${flightNo}(${departureDateTime})이 존재하지 않습니다.`
      );
    }    const sql = 'DELETE FROM AIRPLANE WHERE flightNo = :1 AND TRUNC(departureDateTime) = TRUNC(TO_TIMESTAMP(:2, \'YYYY-MM-DD HH24:MI:SS\'))';

    try {
      const result = await this.dbService.executeNonQuery(sql, [flightNo, this.formatDateForDB(departureDateTime)]);
      if (result === 0) {
        throw new NotFoundException(
          `삭제 실패: 항공편 ${flightNo}(${departureDateTime})이 존재하지 않습니다.`
        );
      }
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`항공편 삭제 오류: ${error.message}`);

      // 외래 키 제약 조건 위반 오류 (관련 좌석 정보가 있는 경우)
      if (error.message.includes('integrity constraint')) {
        throw new ConflictException(
          '이 항공편과 연결된 좌석 또는 예약 정보가 있어 삭제할 수 없습니다. 좌석 정보를 먼저 삭제해주세요.'
        );
      }

      throw new InternalServerErrorException(
        '항공편 삭제 중 오류가 발생했습니다.'
      );
    }
  }
}
