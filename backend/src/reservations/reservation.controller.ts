import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus,
  Query
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import { Reservation } from './reservation.interface';
import { CreateReservationDto, ReservationFilterDto } from './dto/reservation.dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  private capitalizeSeatClass(seatClass: string): string {
    return seatClass.charAt(0).toUpperCase() + seatClass.slice(1).toLowerCase();
  }

  @ApiOperation({ summary: '모든 예약 조회', description: '시스템에 등록된 모든 예약 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '예약 목록 조회 성공' })
  @Get()
  findAll(): Promise<Reservation[]> {
    return this.reservationService.findAll();
  }

  @ApiOperation({ summary: '항공편별 예약 조회', description: '특정 항공편의 예약 정보를 조회합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiResponse({ status: 200, description: '항공편별 예약 조회 성공' })
  @Get('flight/:flightNo/:departureDateTime')
  findByFlight(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTime: string
  ): Promise<Reservation[]> {
    const parsedDateTime = new Date(departureDateTime);
    return this.reservationService.findByFlight(flightNo, parsedDateTime);
  }  @ApiOperation({ summary: '고객별 예약 조회', description: '특정 고객의 예약 정보를 조회합니다. 조회 기간 설정 가능.' })
  @ApiParam({ name: 'cno', description: '고객 번호', example: 'C1001' })
  @ApiQuery({ name: 'fromDate', description: '시작 날짜 (YYYY-MM-DD 형식) - 이 날짜 이후의 예약만 조회', required: false })
  @ApiQuery({ name: 'toDate', description: '종료 날짜 (YYYY-MM-DD 형식) - 이 날짜 이전의 예약만 조회', required: false })
  @ApiResponse({ status: 200, description: '고객별 예약 조회 성공' })  @Get('customer/:cno')
  findByCustomerId(
    @Param('cno') cno: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ): Promise<Reservation[]> {
    return this.reservationService.findByCustomerId(cno, fromDate, toDate);
  }
  @ApiOperation({ summary: '특정 예약 조회', description: '특정 예약의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiParam({ name: 'seatClass', description: '좌석 클래스', example: 'business' })
  @ApiParam({ name: 'cno', description: '고객 번호', example: 'C1001' })
  @ApiResponse({ status: 200, description: '예약 조회 성공' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  @Get(':flightNo/:departureDateTime/:seatClass/:cno')
  findOne(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTime: string,
    @Param('seatClass') seatClass: string,
    @Param('cno') cno: string
  ): Promise<Reservation | null> {
    const parsedDateTime = new Date(departureDateTime);
    return this.reservationService.findOne(flightNo, parsedDateTime, this.capitalizeSeatClass(seatClass), cno);
  }

  @ApiOperation({ summary: '새 예약 생성', description: '새로운 예약을 생성합니다.' })
  @ApiBody({ type: CreateReservationDto })
  @ApiResponse({ status: 201, description: '예약 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 409, description: '이미 동일한 예약이 존재함' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReservationDto: CreateReservationDto): Promise<Reservation> {
    createReservationDto.seatClass = this.capitalizeSeatClass(createReservationDto.seatClass);
    return this.reservationService.create(createReservationDto);
  }

  @ApiOperation({ summary: '예약 취소', description: '기존 예약을 삭제(취소)합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiParam({ name: 'seatClass', description: '좌석 클래스', example: 'business' })
  @ApiParam({ name: 'cno', description: '고객 번호', example: 'C1001' })
  @ApiResponse({ status: 204, description: '예약 취소 성공' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  @Delete(':flightNo/:departureDateTime/:seatClass/:cno')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTime: string,
    @Param('seatClass') seatClass: string,
    @Param('cno') cno: string
  ): Promise<boolean> {
    const parsedDateTime = new Date(departureDateTime);
    return this.reservationService.delete(flightNo, parsedDateTime, this.capitalizeSeatClass(seatClass), cno);
  }
}
