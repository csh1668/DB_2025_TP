export interface User {
  cno: string;
  name: string;
  passwd: string;
  email: string;
  passportNumber?: string;
}

export interface CreateUserDto {
  cno: string;
  name: string;
  passwd: string;
  email: string;
  passportNumber?: string;
}

export interface UpdateUserDto {
  name?: string;
  passwd?: string;
  email?: string;
  passportNumber?: string;
}
