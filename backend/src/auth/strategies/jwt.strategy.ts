import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../users/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET') || undefined,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOne(payload.cno);
    
    if (!user) {
      throw new UnauthorizedException('접근 권한이 없습니다.');
    }
    
    // 비밀번호는 제외하고 사용자 정보 반환
    const { passwd, ...result } = user;
    return result;
  }
}
