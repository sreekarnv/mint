import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { KycService } from './kyc.service';

@Controller('admin/kyc')
@UseGuards(AdminJwtGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post(':profileId/approve')
  async approve(@Req() req: any, @Param('profileId') profileId: string) {
    return this.kycService.approveKyc(profileId, req.user.sub);
  }

  @Post(':profileId/reject')
  async reject(
    @Req() req: any,
    @Param('profileId') profileId: string,
    @Body() body: { reason: string },
  ) {
    return this.kycService.rejectKyc(profileId, req.user.sub, body.reason);
  }
}
