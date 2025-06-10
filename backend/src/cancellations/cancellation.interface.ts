import { ApiProperty } from '@nestjs/swagger';

// 예약 취소 인터페이스 정의
export class Cancellation {
  @ApiProperty({ description: '항공편 번호', example: 'KE123' })
  flightNo: string;
  
  @ApiProperty({ description: '출발 일시', example: '2025-06-15T09:30:00.000Z' })
  departureDateTime: string;
  
  @ApiProperty({ description: '좌석 클래스', example: 'business', enum: ['business', 'economy'] })
  seatClass: string;
  
  @ApiProperty({ description: '환불 금액', example: 280000 })
  refund: number;
  
  @ApiProperty({ description: '취소 일시', example: '2025-06-12T10:15:00.000Z' })
  cancelDateTime: string;
  
  @ApiProperty({ description: '고객 번호', example: 'C1001' })
  cno: string;
}
