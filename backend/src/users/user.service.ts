import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as oracledb from 'oracledb';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { User } from './user.interface';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  private logger: Logger = new Logger(UserService.name);

  constructor(private dbService: DatabaseService) {}

  private mapToUser(row: any): User {
    return {
      cno: row.CNO,
      name: row.NAME,
      passwd: row.PASSWD,
      email: row.EMAIL,
      passportNumber: row.PASSPORTNUMBER,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) as total FROM CUSTOMER`;
    const countResult =
      await this.dbService.executeQuery<Record<string, number>>(countSql);
    const total = countResult[0]?.['TOTAL'] || 0;

    const sql = `
      SELECT cno, name, passwd, email, passportNumber 
      FROM (
        SELECT a.*, ROWNUM as rnum
        FROM (
          SELECT cno, name, passwd, email, passportNumber 
          FROM CUSTOMER
          ORDER BY cno
        ) a
        WHERE ROWNUM <= :1
      )
      WHERE rnum > :2
    `;

    const users = await this.dbService
      .executeQuery<User>(sql, [offset + limit, offset])
      .then((rows) => rows.map(this.mapToUser));

    return { users, total };
  }

  async findOne(cno: string): Promise<User | null> {
    const sql = `SELECT cno, name, passwd, email, passportNumber FROM CUSTOMER WHERE cno = :1`;
    const users = await this.dbService
      .executeQuery<User>(sql, [cno])
      .then((rows) => rows.map(this.mapToUser));

    return users.length > 0 ? users[0] : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = `SELECT cno, name, passwd, email, passportNumber FROM CUSTOMER WHERE email = :1`;
    const users = await this.dbService
      .executeQuery<User>(sql, [email])
      .then((rows) => rows.map(this.mapToUser));
    return users.length > 0 ? users[0] : null;
  }

  async findByCno(cno: string): Promise<User | null> {
    const sql = `SELECT cno, name, passwd, email, passportNumber FROM CUSTOMER WHERE cno = :1`;
    const users = await this.dbService
      .executeQuery<User>(sql, [cno])
      .then((rows) => rows.map(this.mapToUser));
    return users.length > 0 ? users[0] : null;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // cno 중복 확인
      const existingUser = await this.findOne(createUserDto.cno);
      if (existingUser) {
        throw new ConflictException(
          `사용자 고객번호 ${createUserDto.cno}는 이미 존재합니다.`,
        );
      }
      // 이메일 중복 확인
      const existingEmailUser = await this.findByEmail(createUserDto.email);
      if (existingEmailUser) {
        throw new ConflictException(
          `이메일 ${createUserDto.email}는 이미 사용 중입니다.`,
        );
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`사용자 정보 검증 오류: ${error.message}`);
      throw new InternalServerErrorException(
        '사용자 정보를 확인하는 중 오류가 발생했습니다.',
      );
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.passwd, salt);

    // DTO를 User 객체로 변환
    const user: User = {
      ...createUserDto,
      passwd: hashedPassword,
    };
    const sql = `
      INSERT INTO CUSTOMER (cno, name, passwd, email, passportNumber) 
      VALUES (:1, :2, :3, :4, :5)
    `;

    let connection: oracledb.Connection;
    try {
      connection = await oracledb.getConnection();
      try {
        await connection.execute(
          sql,
          [
            user.cno,
            user.name,
            user.passwd, // 해싱된 비밀번호를 저장
            user.email,
            user.passportNumber || null,
          ],
          { autoCommit: true },
        );

        return user;
      } catch (dbError) {
        this.logger.error(`데이터베이스 오류: ${dbError.message}`);
        if (dbError.message.includes('unique constraint')) {
          throw new ConflictException(
            '중복된 정보가 존재합니다. 고객번호 또는 이메일을 확인해주세요.',
          );
        }
        throw new InternalServerErrorException(
          '사용자 등록 중 오류가 발생했습니다.',
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
        '데이터베이스 연결 중 오류가 발생했습니다.',
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

  async update(cno: string, updateUserDto: UpdateUserDto): Promise<number> {
    // 업데이트할 필드가 없는 경우 오류 처리
    if (Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('수정할 정보가 없습니다.');
    }

    // 사용자가 존재하는지 확인
    const existingUser = await this.findOne(cno);
    if (!existingUser) {
      throw new BadRequestException(
        `고객번호 ${cno}에 해당하는 사용자가 존재하지 않습니다.`,
      );
    }

    let sql = 'UPDATE CUSTOMER SET ';
    const params = [];
    const updateFields = [];
    let paramIndex = 1;

    if (updateUserDto.name !== undefined) {
      updateFields.push(`name = :${paramIndex}`);
      params.push(updateUserDto.name);
      paramIndex++;
    }
    if (updateUserDto.passwd !== undefined) {
      // 비밀번호 해싱
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(updateUserDto.passwd, salt);

      updateFields.push(`passwd = :${paramIndex}`);
      params.push(hashedPassword);
      paramIndex++;
    }

    if (updateUserDto.email !== undefined) {
      updateFields.push(`email = :${paramIndex}`);
      params.push(updateUserDto.email);
      paramIndex++;
    }

    if (updateUserDto.passportNumber !== undefined) {
      updateFields.push(`passportNumber = :${paramIndex}`);
      params.push(updateUserDto.passportNumber);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new BadRequestException('수정할 유효한 정보가 없습니다.');
    }

    sql += updateFields.join(', ');
    sql += ` WHERE cno = :${paramIndex}`;
    params.push(cno);

    try {
      const result = await this.dbService.executeNonQuery(sql, params);
      if (result === 0) {
        throw new BadRequestException(
          `업데이트 실패: 고객번호 ${cno}에 해당하는 사용자가 없습니다.`,
        );
      }
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`사용자 업데이트 오류: ${error.message}`, error.stack);
      if (error.message.includes('unique constraint')) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
      throw new InternalServerErrorException(
        '사용자 정보 업데이트 중 오류가 발생했습니다.',
      );
    }
  }

  async delete(cno: string): Promise<number> {
    // 사용자가 존재하는지 확인
    const existingUser = await this.findOne(cno);
    if (!existingUser) {
      throw new BadRequestException(
        `고객번호 ${cno}에 해당하는 사용자가 존재하지 않습니다.`,
      );
    }

    // 사용자와 관련된 예약 및 취소 기록이 존재할 경우 삭제가 실패할 수 있습니다.
    const sql = 'DELETE FROM CUSTOMER WHERE cno = :1';

    try {
      const result = await this.dbService.executeNonQuery(sql, [cno]);
      if (result === 0) {
        throw new BadRequestException(
          `삭제 실패: 고객번호 ${cno}에 해당하는 사용자가 없습니다.`,
        );
      }
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`사용자 삭제 오류: ${error.message}`);

      // 외래 키 제약 조건 위반 오류 (관련 예약 또는 취소 레코드가 있는 경우)
      if (error.message.includes('integrity constraint')) {
        throw new ConflictException(
          '이 사용자와 연결된 예약 또는 취소 정보가 있어 삭제할 수 없습니다.',
        );
      }

      throw new InternalServerErrorException(
        '사용자 삭제 중 오류가 발생했습니다.',
      );
    }
  }
}
