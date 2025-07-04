import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, LoginResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}  async validateUser(emailOrCno: string, passwd: string): Promise<any> {
    // 이메일 또는 사용자 ID로 사용자 조회
    let user = null;
    
    // 이메일 주소 형식인지 확인
    if (emailOrCno.includes('@')) {
      user = await this.userService.findByEmail(emailOrCno);
      if (!user) {
        this.logger.warn(`이메일 인증 실패: ${emailOrCno}`);
      }
    } else {
      // 이메일이 아니라면 사용자 ID(cno)로 시도
      user = await this.userService.findByCno(emailOrCno);
      if (!user) {
        this.logger.warn(`ID 인증 실패: ${emailOrCno}`);
      }
    }
    
    // 사용자가 존재하지 않으면 null 반환
    if (!user) {
      return null;
    }
    
    // bcrypt를 사용하여 비밀번호 검증
    // 데이터베이스에 비밀번호가 해싱되어 저장되지 않은 경우를 위한 임시 처리
    let isPasswordValid = false;
    
    // 해싱된 비밀번호인지 확인 (bcrypt 해시는 $2b로 시작함)
    if (user.passwd.startsWith('$2b')) {
      isPasswordValid = await bcrypt.compare(passwd, user.passwd);
    } else {
      // 데이터베이스의 비밀번호가 아직 해싱되지 않았다면 직접 비교
      // 이는 시스템 전환 과정에서만 사용되어야 함
      isPasswordValid = user.passwd === passwd;
    }
    
    if (!isPasswordValid) {
      this.logger.warn(`비밀번호 불일치: ${emailOrCno}`);
      return null;
    }
    
    const { passwd: _, ...result } = user;
    return result;
  }
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { emailOrCno, passwd } = loginDto;
    const user = await this.validateUser(emailOrCno, passwd);
    
    if (!user) {
      throw new UnauthorizedException('아이디/이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    
    const payload = { cno: user.cno, email: user.email, name: user.name };
    
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  // 비밀번호 해싱 메서드 (가입이나 비밀번호 변경 시 사용)
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
