import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AirlineRevenueRank, AirportAirlineRevenueRank } from './statistics.interface';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 항공사별 매출 순위를 조회 (그룹 함수 활용)
   * - GROUP BY와 SUM 함수를 사용하여 항공사별 총 매출액 계산
   * - ORDER BY를 이용해 내림차순 정렬
   */
  async getAirlineRevenueRanking(): Promise<AirlineRevenueRank[]> {
    try {
      const sql = `
        SELECT 
          a.airline, 
          NVL(SUM(r.payment), 0) as total_revenue,
          COUNT(r.flightNo) as reservation_count
        FROM 
          AIRPLANE a
          LEFT JOIN RESERVE r ON r.flightNo = a.flightNo AND r.departureDateTime = a.departureDateTime
        GROUP BY 
          a.airline
        ORDER BY 
          total_revenue DESC
      `;

      const result = await this.databaseService.executeQuery<AirlineRevenueRank>(sql);
      console.log('항공사별 매출 순위 조회 결과:', result);
      return result;
    } catch (error) {
      this.logger.error(`항공사별 매출 순위 조회 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  /**
   * 출발 공항과 항공사별 매출 순위를 조회 (윈도우 함수 활용)
   * - PARTITION BY와 RANK() 함수를 사용하여 출발 공항별로 항공사 매출 순위 계산
   */
  async getAirportAirlineRevenueRanking(): Promise<AirportAirlineRevenueRank[]> {
    try {
      const sql = `
        SELECT 
          departureAirport,
          airline,
          total_revenue,
          revenue_rank
        FROM (
          SELECT 
            a.departureAirport,
            a.airline,
            NVL(SUM(r.payment), 0) as total_revenue,
            RANK() OVER (PARTITION BY a.departureAirport ORDER BY NVL(SUM(r.payment), 0) DESC) as revenue_rank
          FROM 
            AIRPLANE a
            LEFT JOIN RESERVE r ON r.flightNo = a.flightNo AND r.departureDateTime = a.departureDateTime
          GROUP BY 
            a.departureAirport, a.airline
        )
        ORDER BY 
          departureAirport, revenue_rank
      `;

      const result = await this.databaseService.executeQuery<AirportAirlineRevenueRank>(sql);
      console.log('출발 공항 및 항공사별 매출 순위 조회 결과:', result);
      return result;
    } catch (error) {
      this.logger.error(`출발 공항 및 항공사별 매출 순위 조회 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  /**
   * 출발 공항 및 항공사별 매출 요약 (ROLLUP 활용)
   * - ROLLUP 함수를 사용하여 공항별, 항공사별, 전체 매출 합계 계산
   * - GROUPING 함수를 이용하여 소계와 총계 식별
   */
  async getAirportAirlineRevenueSummary() {
    try {
      const sql = `
        SELECT 
          CASE 
            WHEN GROUPING(a.departureAirport) = 1 AND GROUPING(a.airline) = 1 THEN '전체 공항'
            WHEN GROUPING(a.departureAirport) = 1 THEN '-'
            WHEN GROUPING(a.airline) = 1 THEN a.departureAirport || ' 전체'
            ELSE a.departureAirport
          END AS departureAirport,
          CASE 
            WHEN GROUPING(a.airline) = 1 AND GROUPING(a.departureAirport) = 1 THEN '전체 항공사'
            WHEN GROUPING(a.airline) = 1 THEN '-'
            WHEN GROUPING(a.departureAirport) = 1 THEN a.airline || ' 전체'
            ELSE a.airline
          END AS airline,
          NVL(SUM(r.payment), 0) as total_revenue,
          COUNT(r.flightNo) as reservation_count,
          GROUPING(a.departureAirport) as is_airport_total,
          GROUPING(a.airline) as is_airline_total,
          CASE 
            WHEN GROUPING(a.departureAirport) = 1 AND GROUPING(a.airline) = 1 THEN 3  -- 총계
            WHEN GROUPING(a.departureAirport) = 1 THEN 2  -- 공항별 소계
            WHEN GROUPING(a.airline) = 1 THEN 1  -- 항공사별 소계
            ELSE 0  -- 일반 행
          END as summary_level
        FROM 
          AIRPLANE a
          LEFT JOIN RESERVE r ON r.flightNo = a.flightNo AND r.departureDateTime = a.departureDateTime
        GROUP BY 
            CUBE(a.departureAirport, a.airline)
        ORDER BY 
          summary_level DESC,
          departureAirport,
          airline
      `;

      const result = await this.databaseService.executeQuery(sql);
    //   console.log('출발 공항 및 항공사별 매출 요약 조회 결과:', result);
      return result;
    } catch (error) {
      this.logger.error(`출발 공항 및 항공사별 매출 요약 조회 중 오류 발생: ${error.message}`);
      throw error;
    }
  }/**
   * 월별 항공사 매출 추이 (최적화 버전)
   * - 복잡한 윈도우 함수 대신 간단한 쿼리 사용
   * - 데이터 양을 줄이고 인덱스를 잘 활용하도록 수정
   * - 현재 월을 기준으로 앞뒤로 3개월씩 데이터 조회 (예약은 미래 매출도 포함)
   */
  async getMonthlyAirlineRevenueTrends() {
    try {
      // 첫 번째 쿼리: 직접 항공사별 월간 매출 계산 (현재 월 기준 앞뒤 3개월)
      const monthlyRevenueQuery = `
        SELECT
          a.airline,
          EXTRACT(YEAR FROM r.reserveDateTime) as revenue_year,
          EXTRACT(MONTH FROM r.reserveDateTime) as revenue_month,
          SUM(r.payment) as monthly_revenue
        FROM
          AIRPLANE a
          JOIN RESERVE r ON r.flightNo = a.flightNo AND r.departureDateTime = a.departureDateTime
        WHERE
          r.reserveDateTime BETWEEN ADD_MONTHS(SYSDATE, -3) AND ADD_MONTHS(SYSDATE, 3)
        GROUP BY
          a.airline,
          EXTRACT(YEAR FROM r.reserveDateTime),
          EXTRACT(MONTH FROM r.reserveDateTime)
        ORDER BY
          a.airline,
          revenue_year,
          revenue_month
      `;

      const monthlyRevenue = await this.databaseService.executeQuery<{
          MONTHLY_REVENUE(MONTHLY_REVENUE: any): unknown;
          REVENUE_YEAR: any;
          REVENUE_MONTH: any;AIRLINE: string
}>(monthlyRevenueQuery);
        // 두 번째 쿼리: 모든 항공사 목록 (매출이 없는 항공사도 포함)
      const airlinesQuery = `
        SELECT DISTINCT airline FROM AIRPLANE
      `;
      const airlines = await this.databaseService.executeQuery<{AIRLINE: string}>(airlinesQuery);
      
      // JavaScript에서 누적 합계 계산 및 데이터 가공
      const result = [];
      
      // 현재 날짜 기준 앞뒤 3개월 범위 생성
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // 필요한 모든 월 생성 (월별 키 맵)
      const allMonths = [];
      for (let i = -3; i <= 3; i++) {
        let targetMonth = currentMonth + i;
        let targetYear = currentYear;
        
        // 월 조정 (1-12 범위로)
        if (targetMonth < 1) {
          targetMonth += 12;
          targetYear -= 1;
        } else if (targetMonth > 12) {
          targetMonth -= 12;
          targetYear += 1;
        }
        
        allMonths.push({
          year: targetYear,
          month: targetMonth
        });
      }
      
      // 각 항공사별 월간 수익을 맵으로 변환 (빠른 조회를 위해)
      const revenueByAirlineAndMonth = {};
      monthlyRevenue.forEach(item => {
        const airlineName = item.AIRLINE;
        const key = `${airlineName}|${item.REVENUE_YEAR}-${item.REVENUE_MONTH}`;
        revenueByAirlineAndMonth[key] = Number(item.MONTHLY_REVENUE);
      });
      
      // 모든 항공사에 대해 모든 월 데이터 생성
      for (const airline of airlines) {
        const airlineName = airline.AIRLINE;
        let cumulativeRevenue = 0;
        
        // 모든 월에 대해 데이터 생성 (없는 월은 0으로 채움)
        for (const monthData of allMonths) {
          const key = `${airlineName}|${monthData.year}-${monthData.month}`;
          const monthlyRevenue = revenueByAirlineAndMonth[key] || 0;
          
          cumulativeRevenue += monthlyRevenue;
          
          result.push({
            AIRLINE: airlineName,
            REVENUE_YEAR: monthData.year,
            REVENUE_MONTH: monthData.month,
            MONTHLY_REVENUE: monthlyRevenue,
            CUMULATIVE_REVENUE: cumulativeRevenue
          });
        }
      }
        // 항공사별, 연도별, 월별로 정렬
      result.sort((a, b) => {
        if (a.AIRLINE !== b.AIRLINE) return a.AIRLINE.localeCompare(b.AIRLINE);
        if (a.REVENUE_YEAR !== b.REVENUE_YEAR) return a.REVENUE_YEAR - b.REVENUE_YEAR;
        return a.REVENUE_MONTH - b.REVENUE_MONTH;
      });
      
      // 누적 매출 다시 계산 (정렬 후)
      // 항공사별로 그룹화
      const airlineGroups: { [key: string]: Array<any> } = {};
      
      // 항공사별 그룹 생성
      result.forEach(item => {
        if (!airlineGroups[item.AIRLINE]) {
          airlineGroups[item.AIRLINE] = [];
        }
        airlineGroups[item.AIRLINE].push(item);
      });
      
      // 각 항공사별로 누적 매출 재계산
      Object.values(airlineGroups).forEach(group => {
        let cumulative = 0;
        group.forEach(item => {
          cumulative += item.MONTHLY_REVENUE;
          item.CUMULATIVE_REVENUE = cumulative;
        });
      });
        console.log('월별 항공사 매출 추이 조회 결과:', result);
      return result;
    } catch (error) {
      this.logger.error(`월별 항공사 매출 추이 조회 중 오류 발생: ${error.message}`);
      throw error;
    }
  }
  /**
   * 인기 여행지 순위 (도착 공항별 예약 건수로 랭킹)
   * - PARTITION BY와 RANK() 함수를 사용하여 도착 공항별 예약 건수 순위 계산
   * - 출발 시간이 현재보다 이후인 예약만 고려함
   */
  async getPopularDestinationsRanking(): Promise<any> {
    try {
      const sql = `
        SELECT 
          ar.arrivalAirport AS ARRIVALAIRPORT,
          ar.reservation_count AS RESERVATION_COUNT,
          RANK() OVER (ORDER BY ar.reservation_count DESC) AS RANKING
        FROM 
          (
          SELECT 
            a.arrivalAirport,
            COUNT(r.flightNo) as reservation_count
          FROM 
            AIRPLANE a
            JOIN RESERVE r ON r.flightNo = a.flightNo AND r.departureDateTime = a.departureDateTime
          WHERE 
            a.departureDateTime > SYSTIMESTAMP
          GROUP BY 
            a.arrivalAirport
        ) ar
        ORDER BY 
          RANKING
      `;

      const result = await this.databaseService.executeQuery(sql);
      console.log('인기 여행지 순위 조회 결과:', result);
      return result;
    } catch (error) {
      this.logger.error(`인기 여행지 순위 조회 중 오류 발생: ${error.message}`);
      throw error;
    }
  }
}
