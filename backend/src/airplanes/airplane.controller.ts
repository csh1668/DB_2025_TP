import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AirplaneService } from './airplane.service';
import { Airplane } from './airplane.interface';
import { CreateAirplaneDto, UpdateAirplaneDto } from './dto/airplane.dto';

@ApiTags('airplanes')
@Controller('airplanes')
export class AirplaneController {
  constructor(private airplaneService: AirplaneService) {}

  @ApiOperation({ summary: '항공편 전체 조회', description: '모든 항공편 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '항공편 목록 조회 성공' })
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('sortBy') sortBy: string = 'departureDateTime',
    @Query('departureAirport') departureAirport?: string,
    @Query('arrivalAirport') arrivalAirport?: string,
    @Query('departureDate') departureDateStr?: string,
  ): Promise<{ airplanes: Airplane[]; total: number }> {
    console.log(`${departureDateStr} -> ${new Date(departureDateStr)}`);
    return this.airplaneService.findAll(
      page,
      10,
      sortBy,
      departureAirport,
      arrivalAirport,
      departureDateStr ? new Date(departureDateStr) : undefined,
    );
  }
  
  @ApiOperation({ summary: '항공편 상세 조회', description: '특정 항공편의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiResponse({ status: 200, description: '항공편 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '항공편을 찾을 수 없음' })
  @Get(':flightNo/:departureDateTime')
  async findOne(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTimeStr: string
  ): Promise<Airplane> {
    const departureDateTime = new Date(departureDateTimeStr);
    
    const airplane = await this.airplaneService.findByKey(flightNo, departureDateTime);
    
    if (!airplane) {
      throw new Error(`항공편 ${flightNo}(${departureDateTimeStr})을 찾을 수 없습니다.`);
    }
    
    return airplane;
  }

  @Get(':flightNo')
  async findOneByFlightNo(
    @Param('flightNo') flightNo: string
  ): Promise<Airplane> {
    const airplane = await this.airplaneService.findByFlightNo(flightNo);
    
    return airplane;
  }
  
  @ApiOperation({ summary: '항공편 등록', description: '새로운 항공편을 등록합니다.' })
  @ApiBody({ type: /* AirplaneDto 등 */ Object })
  @ApiResponse({ status: 201, description: '항공편 등록 성공' })
  @Post()
  async create(@Body() createAirplaneDto: CreateAirplaneDto): Promise<Airplane> {
    return this.airplaneService.create(createAirplaneDto);
  }
  
  @ApiOperation({ summary: '항공편 수정', description: '기존 항공편 정보를 수정합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiBody({ type: /* UpdateAirplaneDto 등 */ Object })
  @ApiResponse({ status: 200, description: '항공편 수정 성공' })
  @Put(':flightNo/:departureDateTime')
  async update(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTimeStr: string,
    @Body() updateAirplaneDto: UpdateAirplaneDto
  ): Promise<{success: boolean; message: string}> {
    const departureDateTime = new Date(departureDateTimeStr);
    await this.airplaneService.update(flightNo, departureDateTime, updateAirplaneDto);
    
    return {
      success: true,
      message: `항공편 ${flightNo}(${departureDateTimeStr})이 성공적으로 업데이트되었습니다.`
    };
  }
  
  @ApiOperation({ summary: '항공편 삭제', description: '기존 항공편 정보를 삭제합니다.' })
  @ApiParam({ name: 'flightNo', description: '항공편 번호', example: 'KE123' })
  @ApiParam({ name: 'departureDateTime', description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  @ApiResponse({ status: 200, description: '항공편 삭제 성공' })
  @Delete(':flightNo/:departureDateTime')
  async delete(
    @Param('flightNo') flightNo: string,
    @Param('departureDateTime') departureDateTimeStr: string
  ): Promise<{success: boolean; message: string}> {
    const departureDateTime = new Date(departureDateTimeStr);
    await this.airplaneService.delete(flightNo, departureDateTime);
    
    return {
      success: true,
      message: `항공편 ${flightNo}(${departureDateTimeStr})이 성공적으로 삭제되었습니다.`
    };
  }
}
