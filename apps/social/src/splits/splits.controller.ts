import { JWTAuthGuard } from '@mint/common';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SplitsService } from './splits.service';

@Controller('api/v1/social/splits')
export class SplitsController {
  constructor(private readonly splitsService: SplitsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  async list(@Req() req: any) {
    return this.splitsService.list(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JWTAuthGuard)
  async get(@Req() req: any, @Param('id') id: string) {
    return this.splitsService.get(id, req.user.sub);
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  async create(
    @Req() req: any,
    @Body()
    body: {
      title: string;
      totalCents: number;
      currency?: string;
      participants: Array<{ userId: string; amountCents: number }>;
    },
  ) {
    return this.splitsService.create({
      creatorId: req.user.sub,
      title: body.title,
      totalCents: body.totalCents,
      currency: body.currency,
      participants: body.participants,
    });
  }

  @Post(':id/pay')
  @UseGuards(JWTAuthGuard)
  async pay(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { transactionId: string },
  ) {
    return this.splitsService.pay(id, req.user.sub, body.transactionId);
  }
}
