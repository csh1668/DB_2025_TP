import { IsString, IsNumber, IsDate, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 예약 생성용 DTO
export class CreateReservationDto {
  @ApiProperty({ 
    description: '항공편 번호', 
    example: 'KE123' 
  })
  @IsString()
  @IsNotEmpty()
  flightNo: string;

  @ApiProperty({ 
    description: '출발 일시',
    example: '2025-06-15T09:30:00.000Z',
    type: Date
  })
  @IsNotEmpty()
  departureDateTime: Date;

  @ApiProperty({ 
    description: '좌석 클래스',
    example: 'business',
    enum: ['business', 'economy']
  })
  @IsString()
  @IsNotEmpty()
  seatClass: string;

  @ApiProperty({ 
    description: '결제 금액',
    example: 350000,
    type: Number
  })
  @IsNumber()
  @IsNotEmpty()
  payment: number;

  @ApiProperty({ 
    description: '고객 번호',
    example: 'C1001'
  })
  @IsString()
  @IsNotEmpty()
  cno: string;
}

// 예약 수정용 DTO
export class UpdateReservationDto {
  @ApiProperty({ 
    description: '결제 금액',
    example: 350000,
    required: false
  })
  @IsNumber()
  @IsOptional()
  payment?: number;

  @ApiProperty({ 
    description: '예약 일시',
    example: '2025-06-10T10:30:00.000Z',
    required: false
  })
  @IsDate()
  @IsOptional()
  reserveDateTime?: Date;
}

// 예약 검색용 DTO
export class ReservationFilterDto {
  @ApiProperty({ 
    description: '항공편 번호',
    example: 'KE123',
    required: false
  })
  @IsString()
  @IsOptional()
  flightNo?: string;

  @ApiProperty({ 
    description: '출발 일시',
    example: '2025-06-15',
    required: false
  })
  @IsOptional()
  departureDateTime?: Date;

  @ApiProperty({ 
    description: '좌석 클래스',
    example: 'business',
    enum: ['business', 'economy'],
    required: false
  })
  @IsString()
  @IsOptional()
  seatClass?: string;

  @ApiProperty({ 
    description: '고객 번호',
    example: 'C1001',
    required: false
  })
  @IsString()
  @IsOptional()
  cno?: string;
    @ApiProperty({ 
    description: '시작 날짜 (YYYY-MM-DD 형식) - 이 날짜 이후의 예약만 조회',
    example: '2025-01-01',
    required: false
  })
  @IsString()
  @IsOptional()
  fromDate?: string;
  
  @ApiProperty({ 
    description: '종료 날짜 (YYYY-MM-DD 형식) - 이 날짜 이전의 예약만 조회',
    example: '2025-06-30',
    required: false
  })
  @IsString()
  @IsOptional()
  toDate?: string;
}
