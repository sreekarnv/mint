import { JWTAuthGuard } from '@mint/common';
import {
  Body,
  Controller,
  Delete,
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
import { EndpointsService } from './endpoints.service';

@ApiTags('webhooks')
@ApiBearerAuth('access-token')
@Controller('api/v1/webhooks')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'List all webhook endpoints for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Endpoint list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Req() req: any) {
    return this.endpointsService.list(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get a single webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Endpoint ID' })
  @ApiResponse({ status: 200, description: 'Endpoint details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async get(@Req() req: any, @Param('id') id: string) {
    return this.endpointsService.get(id, req.user.sub);
  }

  @Post()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Register a new webhook endpoint' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['url', 'events'],
      properties: {
        url: { type: 'string', example: 'https://example.com/webhook' },
        events: {
          type: 'array',
          items: { type: 'string' },
          example: ['transaction.created', 'kyc.approved'],
        },
        description: { type: 'string', example: 'My webhook' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Endpoint created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Req() req: any,
    @Body()
    body: {
      url: string;
      events: string[];
      description?: string;
    },
  ) {
    return this.endpointsService.create({
      userId: req.user.sub,
      url: body.url,
      events: body.events,
      description: body.description,
    });
  }

  @Patch(':id')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Update a webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Endpoint ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        events: { type: 'array', items: { type: 'string' } },
        description: { type: 'string' },
        active: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Endpoint updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      url?: string;
      events?: string[];
      description?: string;
      active?: boolean;
    },
  ) {
    return this.endpointsService.update(id, req.user.sub, body);
  }

  @Delete(':id')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Endpoint ID' })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.endpointsService.delete(id, req.user.sub);
    return { success: true };
  }

  @Post(':id/rotate-secret')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Rotate the signing secret for a webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Endpoint ID' })
  @ApiResponse({ status: 201, description: 'New secret returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async rotateSecret(@Req() req: any, @Param('id') id: string) {
    return this.endpointsService.rotateSecret(id, req.user.sub);
  }

  @Get(':id/deliveries')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({
    summary: 'List recent delivery attempts for a webhook endpoint',
  })
  @ApiParam({ name: 'id', description: 'Endpoint ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max deliveries to return (default 50)',
    type: 'integer',
  })
  @ApiResponse({ status: 200, description: 'Delivery list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async getDeliveries(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.endpointsService.getDeliveries(id, req.user.sub, limitNum);
  }
}
