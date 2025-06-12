import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AirlineRevenueRank, AirportAirlineRevenueRank, PopularDestinationRank } from './statistics.interface';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('airline-revenue')
  async getAirlineRevenueRanking(): Promise<AirlineRevenueRank[]> {
    return this.statisticsService.getAirlineRevenueRanking();
  }

  @Get('airport-airline-revenue')
  async getAirportAirlineRevenueRanking(): Promise<AirportAirlineRevenueRank[]> {
    return this.statisticsService.getAirportAirlineRevenueRanking();
  }
    @Get('monthly-revenue-trends')
  async getMonthlyAirlineRevenueTrends() {
    return this.statisticsService.getMonthlyAirlineRevenueTrends();
  }
  @Get('airport-airline-revenue-summary')
  async getAirportAirlineRevenueSummary() {
    return this.statisticsService.getAirportAirlineRevenueSummary();
  }

  @Get('popular-destinations')
  async getPopularDestinationsRanking(): Promise<PopularDestinationRank[]> {
    return this.statisticsService.getPopularDestinationsRanking();
  }
}
