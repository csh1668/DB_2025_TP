import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, IsEnum } from 'class-validator';

// 좌석 클래스 열거형 - 'economy', 'business'와 같은 제한된 값만 허용하기 위함
export enum SeatClassEnum {
  ECONOMY = 'economy',
  BUSINESS = 'business',
}

export class CreateSeatDto {
  @IsString()
  @IsNotEmpty()
  flightNo: string;

  @IsDateString()
  @IsNotEmpty()
  departureDateTime: string;

  @IsEnum(SeatClassEnum)
  @IsNotEmpty()
  seatClass: SeatClassEnum;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  no_of_seats: number;
}

export class UpdateSeatDto {
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  no_of_seats: number;
}

// 좌석 조회를 위한 필터 DTO
export class SeatFilterDto {
  @IsString()
  @IsNotEmpty()
  flightNo: string;

  @IsDateString()
  @IsNotEmpty()
  departureDateTime: string;

  @IsEnum(SeatClassEnum, { each: true, message: '유효한 좌석 클래스를 입력해주세요.' })
  seatClass?: SeatClassEnum;
}
