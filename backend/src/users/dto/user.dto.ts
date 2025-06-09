import { IsEmail, IsString, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: '고객 번호는 문자열이어야 합니다' })
  @Length(1, 50, { message: '고객 번호는 1-50자 사이여야 합니다' })
  cno: string;

  @IsString({ message: '이름은 문자열이어야 합니다' })
  @Length(1, 100, { message: '이름은 1-100자 사이여야 합니다' })
  name: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다' })
  @Length(4, 100, { message: '비밀번호는 최소 4자 이상이어야 합니다' })
  passwd: string;

  @IsEmail({}, { message: '유효한 이메일 주소가 아닙니다' })
  email: string;

  @IsOptional()
  @IsString({ message: '여권 번호는 문자열이어야 합니다' })
  @Length(1, 50, { message: '여권 번호는 1-50자 사이여야 합니다' })
  passportNumber?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '이름은 문자열이어야 합니다' })
  @Length(1, 100, { message: '이름은 1-100자 사이여야 합니다' })
  name?: string;

  @IsOptional()
  @IsString({ message: '비밀번호는 문자열이어야 합니다' })
  @Length(4, 100, { message: '비밀번호는 최소 4자 이상이어야 합니다' })
  passwd?: string;

  @IsOptional()
  @IsEmail({}, { message: '유효한 이메일 주소가 아닙니다' })
  email?: string;

  @IsOptional()
  @IsString({ message: '여권 번호는 문자열이어야 합니다' })
  @Length(1, 50, { message: '여권 번호는 1-50자 사이여야 합니다' })
  passportNumber?: string;
}
