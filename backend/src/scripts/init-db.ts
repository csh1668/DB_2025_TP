import * as oracledb from 'oracledb';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

// 환경 변수 로드
dotenv.config();

const logger = new Logger('DatabaseInit');

async function initDatabase() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
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
    
    // SQL 파일 읽기
    const sql = fs.readFileSync(schemaPath, 'utf8');
      // 세미콜론으로 구분된 SQL 명령을 분리
    const statements = sql.split(';').filter(s => s.trim());
    
    // 주석 제거 및 SQL 문장 정리
    const cleanedStatements = statements.map(stmt => {
      // SQL 주석 제거 ('--' 로 시작하는 줄)
      return stmt.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
    }).filter(stmt => stmt); // 비어있지 않은 문장만 필터링
    
    // 각 SQL 명령 실행
    for (const statement of cleanedStatements) {
      try {
        logger.log('SQL 실행: ' + statement.substring(0, 50) + (statement.length > 50 ? '...' : ''));
        await connection.execute(statement, [], { autoCommit: true });
      } catch (err) {
        logger.error(`SQL 실행 오류: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        logger.error(`오류 메시지: ${err.message}`);
        
        // 테이블이 없어서 DROP이 실패한 경우는 무시하고 계속 진행
        if (!err.message.includes('table or view does not exist')) {
          logger.warn('경고: 계속 진행합니다.');
        }
      }
    }
    
    logger.log('데이터베이스 초기화 완료');
    
  } catch (err) {
    logger.error('데이터베이스 초기화 중 오류 발생');
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

initDatabase();
