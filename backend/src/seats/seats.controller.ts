import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpStatus, 
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SeatsService } from './seats.service';
import { Seat } from './seats.interface';
import { CreateSeatDto, UpdateSeatDto, SeatFilterDto, SeatClassEnum } from './dto/seat.dto';
import { Utils } from '../utils/utils';

@ApiTags('seats')
@Controller('seats')
export class SeatsController {
  constructor(private seatsService: SeatsService) {}

  @ApiOperation({ summary: '좌석 전체 조회', description: '모든 좌석 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '좌석 목록 조회 성공' })
  @Get()
  async findAll(
    @Query('flightNo') flightNo?: string,
    @Query('departureDateTime') departureDateTimeStr?: string,
    @Query('seatClass') seatClass?: SeatClassEnum,
  ): Promise<Seat[]> {
    const departureDateTime = departureDateTimeStr ? new Date(departureDateTimeStr) : undefined;
    
    return this.seatsService.findAll(
      flightNo,
      departureDateTime,
      seatClass
    );
  }

  @ApiOperation({ summary: '항공편에 따른 좌석 조회', description: '항공편 번호와 출발 일시로 좌석 정보를 조회합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiResponse({ status: 200, description: '좌석 조회 성공' })
  @ApiResponse({ status: 404, description: '좌석을 찾을 수 없음' })
  @Get('flight/:flightNo/:departureDateTime')
  async findByFlightInfo(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTimeStr: string
  ): Promise<Seat[]> {
    const dateStr = Utils.isoToFormat(departureDateTimeStr);
    
    return this.seatsService.findByFlightInfo(flightNo, dateStr);
  }

  @ApiOperation({ summary: '좌석 클래스에 따른 좌석 조회', description: '좌석 클래스에 따라 좌석 정보를 조회합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiParam({ name: 'seatClass', description: '좌석 클래스', example: 'economy' })
  @ApiResponse({ status: 200, description: '좌석 조회 성공' })
  @ApiResponse({ status: 404, description: '좌석을 찾을 수 없음' })
  @Get(':flightNo/:departureDateTime/:seatClass')
  async findBySeatClass(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTimeStr: string,
    @Param('seatClass') seatClass: string
  ): Promise<Seat> {
    const departureDateTime = new Date(departureDateTimeStr);
    
    return this.seatsService.findBySeatClass(flightNo, departureDateTime, seatClass);
  }

  @ApiOperation({ summary: '좌석 등록', description: '새로운 좌석을 등록합니다.' })
  @ApiBody({ type: CreateSeatDto })
  @ApiResponse({ status: 201, description: '좌석 등록 성공' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSeatDto: CreateSeatDto): Promise<Seat> {
    return this.seatsService.create(createSeatDto);
  }

  @ApiOperation({ summary: '좌석 정보 수정', description: '기존 좌석 정보를 수정합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiParam({ name: 'seatClass', description: '좌석 클래스', example: 'economy' })
  @ApiBody({ type: UpdateSeatDto })
  @ApiResponse({ status: 200, description: '좌석 수정 성공' })
  @ApiResponse({ status: 404, description: '좌석을 찾을 수 없음' })
  @Put(':flightNo/:departureDateTime/:seatClass')
  async update(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTimeStr: string,
    @Param('seatClass') seatClass: string,
    @Body() updateSeatDto: UpdateSeatDto
  ): Promise<Seat> {
    const departureDateTime = new Date(departureDateTimeStr);
    
    return this.seatsService.update(flightNo, departureDateTime, seatClass, updateSeatDto);
  }

  @ApiOperation({ summary: '좌석 삭제', description: '기존 좌석 정보를 삭제합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiParam({ name: 'seatClass', description: '좌석 클래스', example: 'economy' })
  @ApiResponse({ status: 204, description: '좌석 삭제 성공' })
  @ApiResponse({ status: 404, description: '좌석을 찾을 수 없음' })
  @Delete(':flightNo/:departureDateTime/:seatClass')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTimeStr: string,
    @Param('seatClass') seatClass: string
  ): Promise<void> {
    const departureDateTime = new Date(departureDateTimeStr);
    
    return this.seatsService.delete(flightNo, departureDateTime, seatClass);
  }
}
