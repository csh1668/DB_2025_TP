import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AirportService } from "./airport.service";

@ApiTags('airports')
@Controller('airports')
export class AirportController {
    constructor(private readonly airportService: AirportService) {}

    @ApiOperation({ summary: '공항 전체 조회', description: '모든 공항 정보를 조회합니다.' })
    @ApiResponse({ status: 200, description: '공항 목록 조회 성공', type: [String] })
    @Get()
    async findAll(): Promise<string[]> {
        return this.airportService.getAllAirports();
    }

    @ApiOperation({ summary: '국가 목록 조회', description: '등록된 모든 국가 목록을 조회합니다.' })
    @ApiResponse({ status: 200, description: '국가 목록 조회 성공', type: [String] })
    @Get('countries')
    async findCountries(): Promise<string[]> {
        return this.airportService.getCountries();
    }

    @ApiOperation({ summary: '국가별 공항 조회', description: '특정 국가의 공항 목록을 조회합니다.' })
    @ApiParam({ name: 'country', description: '국가명', example: '대한민국' })
    @ApiResponse({ status: 200, description: '국가별 공항 목록 조회 성공', type: [String] })
    @Get('by-country/:country')
    async findByCountry(@Param('country') country: string): Promise<string[]> {
        return this.airportService.getAirportsByCountry(country);
    }

    @ApiOperation({ summary: '공항 코드로 조회', description: '공항 코드를 통해 공항 정보를 조회합니다.' })
    @ApiParam({ name: 'code', description: '공항 코드', example: 'ICN' })
    @ApiResponse({ status: 200, description: '공항 정보 조회 성공', type: String })
    @ApiResponse({ status: 404, description: '공항을 찾을 수 없음' })
    @Get(':code')
    async findByCode(@Param('code') code: string): Promise<string> {
        const airport = this.airportService.getAirportByCode(code);
        if (!airport) {
            throw new Error(`공항 코드 ${code}에 해당하는 공항을 찾을 수 없습니다.`);
        }
        return airport;
    }
}