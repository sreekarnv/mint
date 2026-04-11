import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
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

  @Get()
  @ApiOperation({ summary: 'Search users by email (admin)' })
  @ApiQuery({ name: 'email', required: false, description: 'Email prefix to search' })
  @ApiResponse({ status: 200, description: 'User list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listUsers(@Req() req: any, @Query('email') email?: string) {
    return this.usersService.listUsers(req.user.sub, req.headers.authorization, email);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get full user profile (admin)' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Req() req: any, @Param('userId') userId: string) {
    return this.usersService.getUserProfile(userId, req.user.sub, req.headers.authorization);
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

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Update user role (admin)' })
  @ApiParam({ name: 'userId', description: 'Target user ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['role'],
      properties: {
        role: { type: 'string', enum: ['USER', 'ADMIN'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateRole(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: { role: 'USER' | 'ADMIN' },
  ) {
    return this.usersService.updateUserRole(userId, req.user.sub, body.role, req.headers.authorization);
  }
}
