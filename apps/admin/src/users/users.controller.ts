import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { UsersService } from './users.service';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/users')
@UseGuards(AdminJwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get full user profile (admin)' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Req() req: any, @Param('userId') userId: string) {
    return this.usersService.getUserProfile(userId, req.user.sub);
  }

  @Post(':userId/freeze')
  @ApiOperation({ summary: 'Freeze a user account' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: {
        reason: { type: 'string', example: 'Suspicious activity detected' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Account frozen' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async freezeUser(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: { reason: string },
  ) {
    return this.usersService.freezeUser(userId, req.user.sub, body.reason);
  }

  @Post(':userId/unfreeze')
  @ApiOperation({ summary: 'Unfreeze a user account' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 201, description: 'Account unfrozen' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unfreezeUser(@Req() req: any, @Param('userId') userId: string) {
    return this.usersService.unfreezeUser(userId, req.user.sub);
  }
}
