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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SplitsService } from './splits.service';

@ApiTags('social')
@ApiBearerAuth('access-token')
@Controller('api/v1/social/splits')
export class SplitsController {
  constructor(private readonly splitsService: SplitsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'List all bill splits for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Split list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any) {
    return this.splitsService.list(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get a single bill split with participant details' })
  @ApiParam({ name: 'id', description: 'Split ID' })
  @ApiResponse({ status: 200, description: 'Split details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Split not found' })
  async get(@Req() req: any, @Param('id') id: string) {
    return this.splitsService.get(id, req.user.sub);
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Create a bill split among participants' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'totalCents', 'participants'],
      properties: {
        title: { type: 'string', example: 'Dinner at Nobu' },
        totalCents: { type: 'integer', example: 15000 },
        currency: { type: 'string', example: 'USD' },
        participants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              amountCents: { type: 'integer' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Split created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: "Mark the authenticated user's share of a split as paid",
  })
  @ApiParam({ name: 'id', description: 'Split ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['transactionId'],
      properties: {
        transactionId: { type: 'string', example: 'clx1abc23def456' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Share marked as paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Split not found' })
  async pay(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { transactionId: string },
  ) {
    return this.splitsService.pay(id, req.user.sub, body.transactionId);
  }
}
