import { config } from '@/config/config';

export interface AirlineRevenueRank {
  AIRLINE: string;
  TOTAL_REVENUE: number;
  RESERVATION_COUNT: number;
}

export interface AirportAirlineRevenueRank {
  DEPARTUREAIRPORT: string;
  AIRLINE: string;
  TOTAL_REVENUE: number;
  REVENUE_RANK: number;
}

export interface SeatClassPriceStatistics {
  SEATCLASS: string;
  TOTAL_COUNT: number;
  AVG_PRICE: number;
  MAX_PRICE: number;
  MIN_PRICE: number;
}

export interface MonthlyAirlineRevenueTrend {
  AIRLINE: string;
  REVENUE_YEAR: number;
  REVENUE_MONTH: number;
  MONTHLY_REVENUE: number;
  CUMULATIVE_REVENUE: number;
}

export interface AirportAirlineRevenueSummary {
  DEPARTUREAIRPORT: string;
  AIRLINE: string;
  TOTAL_REVENUE: number;
  RESERVATION_COUNT: number;
  IS_AIRPORT_TOTAL: number;
  IS_AIRLINE_TOTAL: number;
  SUMMARY_LEVEL: number;
}

class StatisticsService {
  private readonly baseUrl = `${config.api.url}/statistics`;

  async getAirlineRevenue(): Promise<AirlineRevenueRank[]> {
    console.log(`Fetching airline revenue ranking from ${this.baseUrl}/airline-revenue`);
    const response = await fetch(`${this.baseUrl}/airline-revenue`);
    
    if (!response.ok) {
      throw new Error(`항공사별 매출 순위 조회 실패: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAirportAirlineRevenue(): Promise<AirportAirlineRevenueRank[]> {
    const response = await fetch(`${this.baseUrl}/airport-airline-revenue`);
    
    if (!response.ok) {
      throw new Error(`출발지별 항공사 매출 순위 조회 실패: ${response.statusText}`);
    }
    
    return response.json();
  }
  async getMonthlyRevenueTrends(): Promise<MonthlyAirlineRevenueTrend[]> {
    const response = await fetch(`${this.baseUrl}/monthly-revenue-trends`);
    
    if (!response.ok) {
      throw new Error(`월별 항공사 매출 추이 조회 실패: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAirportAirlineRevenueSummary() {
    const response = await fetch(`${this.baseUrl}/airport-airline-revenue-summary`);
    
    if (!response.ok) {
      throw new Error(`공항 및 항공사별 매출 요약 조회 실패: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const statisticsService = new StatisticsService();
