import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  HttpCode, 
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { CancellationService } from './cancellation.service';
import { Cancellation } from './cancellation.interface';
import { CreateCancellationDto } from './dto/cancellation.dto';

@ApiTags('cancellations')
@Controller('cancellations')
export class CancellationController {  constructor(private cancellationService: CancellationService) {}

  private capitalizeSeatClass(seatClass: string): string {
    return seatClass.charAt(0).toUpperCase() + seatClass.slice(1).toLowerCase();
  }

  @ApiOperation({ summary: '모든 취소 내역 조회', description: '시스템에 등록된 모든 취소 내역을 조회합니다.' })
  @ApiResponse({ status: 200, description: '취소 내역 목록 조회 성공' })
  @Get()
  findAll(): Promise<Cancellation[]> {
    return this.cancellationService.findAll();
  }

  @ApiOperation({ summary: '항공편별 취소 내역 조회', description: '특정 항공편의 취소 내역을 조회합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiResponse({ status: 200, description: '항공편별 취소 내역 조회 성공' })
  @Get('flight/:flightNo/:departureDateTime')
  findByFlight(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTime: string
  ): Promise<Cancellation[]> {
    const parsedDateTime = new Date(departureDateTime);
    return this.cancellationService.findByFlight(flightNo, parsedDateTime);
  }  @ApiOperation({ summary: '고객별 취소 내역 조회', description: '특정 고객의 취소 내역을 조회합니다. 조회 기간 설정 가능.' })
  @ApiParam({ name: 'cno', description: '고객 번호', example: 'C1001' })
  @ApiQuery({ name: 'fromDate', description: '시작 날짜 (YYYY-MM-DD 형식) - 이 날짜 이후의 취소만 조회', required: false })
  @ApiQuery({ name: 'toDate', description: '종료 날짜 (YYYY-MM-DD 형식) - 이 날짜 이전의 취소만 조회', required: false })
  @ApiResponse({ status: 200, description: '고객별 취소 내역 조회 성공' })
  @Get('customer/:cno')
  findByCustomerId(
    @Param('cno') cno: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ): Promise<Cancellation[]> {
    return this.cancellationService.findByCustomerId(cno, fromDate, toDate);
  }
  @ApiOperation({ summary: '특정 취소 내역 조회', description: '특정 취소 내역의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiParam({ name: 'seatClass', description: '좌석 클래스', example: 'business' })
  @ApiParam({ name: 'cno', description: '고객 번호', example: 'C1001' })
  @ApiResponse({ status: 200, description: '취소 내역 조회 성공' })
  @ApiResponse({ status: 404, description: '취소 내역을 찾을 수 없음' })
  @Get(':flightNo/:departureDateTime/:seatClass/:cno')
  findOne(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTime: string,
    @Param('seatClass') seatClass: string,
    @Param('cno') cno: string
  ): Promise<Cancellation | null> {
    const parsedDateTime = new Date(departureDateTime);
    const formattedSeatClass = this.capitalizeSeatClass(seatClass);
    return this.cancellationService.findOne(flightNo, parsedDateTime, formattedSeatClass, cno);
  }

  @ApiOperation({ summary: '취소 내역 생성', description: '새로운 취소 내역을 생성합니다. (예약 취소 처리)' })
  @ApiBody({ type: CreateCancellationDto })
  @ApiResponse({ status: 201, description: '취소 내역 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCancellationDto: CreateCancellationDto): Promise<Cancellation> {
    createCancellationDto.seatClass = this.capitalizeSeatClass(createCancellationDto.seatClass);
    return this.cancellationService.create(createCancellationDto);
  }
}
