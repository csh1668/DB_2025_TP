import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateAirplaneDto {
  @IsString()
  @IsNotEmpty()
  airline: string;

  @IsString()
  @IsNotEmpty()
  flightNo: string;

  @IsDateString()
  @IsNotEmpty()
  departureDateTime: string;

  @IsDateString()
  @IsNotEmpty()
  arrivalDateTime: string;

  @IsString()
  @IsNotEmpty()
  departureAirport: string;

  @IsString()
  @IsNotEmpty()
  arrivalAirport: string;
}

export class UpdateAirplaneDto {
  @IsString()
  @IsOptional()
  airline?: string;

  @IsDateString()
  @IsOptional()
  arrivalDateTime?: string;

  @IsString()
  @IsOptional()
  departureAirport?: string;

  @IsString()
  @IsOptional()
  arrivalAirport?: string;
}
