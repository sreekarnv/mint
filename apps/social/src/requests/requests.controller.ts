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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestStatus } from '../generated/prisma/enums';
import { RequestsService } from './requests.service';

@ApiTags('social')
@ApiBearerAuth('access-token')
@Controller('api/v1/social/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'List money requests (optionally filtered by status)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'],
    description: 'Filter by request status',
  })
  @ApiResponse({ status: 200, description: 'Request list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any, @Query('status') status?: RequestStatus) {
    return this.requestsService.list(req.user.sub, { status });
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Send a money request to another user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['recipientId', 'amount'],
      properties: {
        recipientId: { type: 'string', example: 'clx1abc23def456' },
        amount: {
          type: 'number',
          example: 2500,
          description: 'Amount in cents',
        },
        currency: { type: 'string', example: 'USD' },
        note: { type: 'string', example: 'Dinner last night' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Request created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Accept a money request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 201, description: 'Request accepted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async accept(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.accept(id, req.user.sub);
  }

  @Post(':id/decline')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Decline a money request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 201, description: 'Request declined' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async decline(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.decline(id, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Cancel a money request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.cancel(id, req.user.sub);
  }
}
