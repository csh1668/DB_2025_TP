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
