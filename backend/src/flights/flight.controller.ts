import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FlightService } from './flight.service';
import { Flight } from './flight.interface';

@Controller('flights')
export class FlightController {
  constructor(private flightService: FlightService) {}

  @Get()
  async findAll(
    @Query('departureAirport') departureAirport?: string,
    @Query('arrivalAirport') arrivalAirport?: string,
    @Query('departureDate') departureDateStr?: string,
  ): Promise<Flight[]> {
    // 검색 조건이 있으면 검색을 수행
    if (departureAirport || arrivalAirport || departureDateStr) {
      const departureDate = departureDateStr ? new Date(departureDateStr) : undefined;
      return this.flightService.search({
        departureAirport,
        arrivalAirport,
        departureDate,
      });
    }
    // 조건이 없으면 전체 항공편 조회
    return this.flightService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Flight | null> {
    return this.flightService.findOne(+id);
  }

  @Post()
  create(@Body() flight: Omit<Flight, 'flightId'>): Promise<Flight> {
    return this.flightService.create(flight);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() flight: Partial<Flight>): Promise<number> {
    return this.flightService.update(+id, flight);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<number> {
    return this.flightService.delete(+id);
  }
}
