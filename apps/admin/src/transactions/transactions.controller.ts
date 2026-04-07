import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { TransactionsService } from './transactions.service';

@Controller('admin/transactions')
@UseGuards(AdminJwtGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post(':id/reverse')
  async reverse(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.transactionsService.reverseTransaction(
      id,
      req.user.sub,
      body.reason,
    );
  }

  @Post(':id/force-complete')
  async forceComplete(@Req() req: any, @Param('id') id: string) {
    return this.transactionsService.forceCompleteTransaction(id, req.user.sub);
  }
}
