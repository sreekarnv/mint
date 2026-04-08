import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { SystemService } from './system.service';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/system')
@UseGuards(AdminJwtGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('limits')
  @ApiOperation({ summary: 'Get global system transaction limits (admin)' })
  @ApiResponse({ status: 200, description: 'System limits' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLimits() {
    return this.systemService.getLimits();
  }

  @Patch('limits')
  @ApiOperation({ summary: 'Update global system transaction limits (admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      description: 'Key-value map of limit fields to update',
      example: { maxTransferCents: 500000, maxTopupCents: 1000000 },
    },
  })
  @ApiResponse({ status: 200, description: 'Limits updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLimits(@Req() req: any, @Body() body: Record<string, any>) {
    return this.systemService.updateLimits(req.user.sub, body);
  }
}
