import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private logger: Logger = new Logger(DatabaseService.name);
  private pool: oracledb.Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      // 오라클 DB 초기화
      oracledb.initOracleClient();

      const dbUserName = this.configService.get<string>('DB_USERNAME');
      const dbPassword = this.configService.get<string>('DB_PASSWORD');
      const dbHost = this.configService.get<string>('DB_HOST');
      const dbPort = this.configService.get<number>('DB_PORT');
      const dbServiceName = this.configService.get<string>('DB_SERVICE_NAME');
      
      // 연결 풀 생성
      this.pool = await oracledb.createPool({
        user: dbUserName,
        password: dbPassword,
        connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${dbHost})(PORT=${dbPort}))(CONNECT_DATA=(SERVICE_NAME=${dbServiceName})))`,
        poolIncrement: 0,
        poolMax: 4,
        poolMin: 2,
        poolTimeout: 60,
      });
      
      this.logger.log('OracleDB 연결 성공');
    } catch (err) {
      this.logger.error('데이터베이스 연결 실패:', err);
      throw err;
    }
  }
  async onModuleDestroy() {
    if (this.pool) {
      try {
        await this.pool.close(0);
        this.logger.log('OracleDB 연결 풀 종료');
      } catch (err) {
        this.logger.error('데이터베이스 연결 풀 종료 실패:', err);
      }
    }
  }
  
  async getConnection(): Promise<oracledb.Connection> {
    try {
      return await this.pool.getConnection();
    } catch (err) {
      this.logger.error('데이터베이스 연결 획득 실패:', err);
      throw err;
    }
  }

  async executeQuery<T>(sql: string, params: any[] = [], options: oracledb.ExecuteOptions = {}): Promise<T[]> {
    let connection: oracledb.Connection;
    try {
      connection = await this.pool.getConnection();
      const result = await connection.execute(sql, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
        ...options,
      });
      
      return result.rows as T[];
    } catch (err) {
      this.logger.error('SQL 실행 오류:', err);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error('연결 종료 오류:', err);
        }
      }
    }
  }

  async executeNonQuery(sql: string, params: any[] = []): Promise<number> {
    let connection: oracledb.Connection;
    try {
      connection = await this.pool.getConnection();
      const result = await connection.execute(sql, params, {
        autoCommit: true,
      });
      
      return result.rowsAffected || 0;
    } catch (err) {
      this.logger.error('SQL 실행 오류:', err);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          this.logger.error('연결 종료 오류:', err);
        }
      }
    }
  }
}
