import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(AdminJwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  async getUser(@Req() req: any, @Param('userId') userId: string) {
    return this.usersService.getUserProfile(userId, req.user.sub);
  }

  @Post(':userId/freeze')
  async freezeUser(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: { reason: string },
  ) {
    return this.usersService.freezeUser(userId, req.user.sub, body.reason);
  }

  @Post(':userId/unfreeze')
  async unfreezeUser(@Req() req: any, @Param('userId') userId: string) {
    return this.usersService.unfreezeUser(userId, req.user.sub);
  }
}
