import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from './user.interface';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  @ApiOperation({ summary: '사용자 전체 조회', description: '모든 사용자 정보를 조회합니다.' })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  @Get('list')
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
  ): Promise<{ users: User[]; total: number }> {
    return this.userService.findAll(page);
  }
  @ApiOperation({ summary: '사용자 상세 조회', description: '특정 사용자의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'cno', description: '고객 번호', example: 'C1001' })
  @ApiResponse({ status: 200, description: '사용자 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @Get(':cno')
  findOne(@Param('cno') cno: string): Promise<User | null> {
    return this.userService.findOne(cno);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string): Promise<User | null> {
    return this.userService.findByEmail(email);
  }

  @ApiOperation({ summary: '사용자 등록', description: '새로운 사용자를 등록합니다.' })
  @ApiBody({ type: /* UserDto 등 */ Object })
  @ApiResponse({ status: 201, description: '사용자 등록 성공' })
  @Post()
  create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Put(':cno')
  update(
    @Param('cno') cno: string,
    @Body() user: Partial<User>,
  ): Promise<number> {
    return this.userService.update(cno, user);
  }

  @Delete(':cno')
  remove(@Param('cno') cno: string): Promise<number> {
    return this.userService.delete(cno);
  }
}
