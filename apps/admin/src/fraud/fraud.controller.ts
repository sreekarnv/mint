import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { FraudService } from './fraud.service';

@Controller('admin/fraud')
@UseGuards(AdminJwtGuard)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Post(':caseId/approve')
  async approve(
    @Req() req: any,
    @Param('caseId') caseId: string,
    @Body() body: { notes?: string },
  ) {
    return this.fraudService.approveFraudCase(caseId, req.user.sub, body.notes);
  }

  @Post(':caseId/block')
  async block(
    @Req() req: any,
    @Param('caseId') caseId: string,
    @Body() body: { notes?: string },
  ) {
    return this.fraudService.blockFraudCase(caseId, req.user.sub, body.notes);
  }
}
