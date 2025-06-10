import { Controller, Post, Body, UseGuards, Get, Request, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponse } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '로그인', description: 'JWT 토큰을 발급받습니다.' })
  @ApiBody({ type: /* LoginDto 등 */ Object })
  @ApiResponse({ status: 201, description: '로그인 성공(JWT 토큰 반환)' })
  @ApiResponse({ status: 401, description: '인증 실패' })  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    this.logger.log(`로그인 시도: ${loginDto.emailOrCno}`);
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // req.user는 JwtStrategy의 validate 메서드에서 반환된 값
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('is-admin')
  isAdmin(@Request() req) {
    const profile = this.getProfile(req);
    if (profile.cno === process.env.ADMIN_CNO) {
      return { isAdmin: true };
    }
    return { isAdmin: false };
  }
}
