import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.interface';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('list')
  findAllDefault(): Promise<{ users: User[], total: number }> {
    return this.userService.findAll(1);
  }
  @Get('list/:page')
  findAll(@Param('page', ParseIntPipe) page: number): Promise<{ users: User[], total: number }> {
    return this.userService.findAll(page);
  }
  @Get(':cno')
  findOne(@Param('cno') cno: string): Promise<User | null> {
    return this.userService.findOne(cno);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string): Promise<User | null> {
    return this.userService.findByEmail(email);
  }

  @Post()
  create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Put(':cno')
  update(@Param('cno') cno: string, @Body() user: Partial<User>): Promise<number> {
    return this.userService.update(cno, user);
  }

  @Delete(':cno')
  remove(@Param('cno') cno: string): Promise<number> {
    return this.userService.delete(cno);
  }
}
