import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { SystemService } from './system.service';

@Controller('admin/system')
@UseGuards(AdminJwtGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('limits')
  async getLimits() {
    return this.systemService.getLimits();
  }

  @Patch('limits')
  async updateLimits(@Req() req: any, @Body() body: Record<string, any>) {
    return this.systemService.updateLimits(req.user.sub, body);
  }
}
