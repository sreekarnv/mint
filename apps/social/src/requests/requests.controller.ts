import { JWTAuthGuard } from '@mint/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequestStatus } from '../generated/prisma/enums';
import { RequestsService } from './requests.service';

@Controller('api/v1/social/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  async list(@Req() req: any, @Query('status') status?: RequestStatus) {
    return this.requestsService.list(req.user.sub, { status });
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  async create(
    @Req() req: any,
    @Body()
    body: {
      recipientId: string;
      amount: number;
      currency?: string;
      note?: string;
    },
  ) {
    return this.requestsService.create({
      requesterId: req.user.sub,
      recipientId: body.recipientId,
      amount: body.amount,
      currency: body.currency,
      note: body.note,
    });
  }

  @Post(':id/accept')
  @UseGuards(JWTAuthGuard)
  async accept(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.accept(id, req.user.sub);
  }

  @Post(':id/decline')
  @UseGuards(JWTAuthGuard)
  async decline(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.decline(id, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JWTAuthGuard)
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.cancel(id, req.user.sub);
  }
}
