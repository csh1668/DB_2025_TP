import { ApiProperty } from '@nestjs/swagger';

// 예약 인터페이스 정의
export class Reservation {
  @ApiProperty({ description: '항공편 번호', example: 'KE123' })
  flightNo: string;
  
  @ApiProperty({ description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  departureDateTime: string;
  
  @ApiProperty({ description: '좌석 클래스', example: 'business', enum: ['business', 'economy'] })
  seatClass: string;
  
  @ApiProperty({ description: '결제 금액', example: 350000 })
  payment: number;
  
  @ApiProperty({ description: '예약 일시', example: '2025-06-10T14:35:00.000Z' })
  reserveDateTime: string;
  
  @ApiProperty({ description: '고객 번호', example: 'C1001' })
  cno: string;
}
