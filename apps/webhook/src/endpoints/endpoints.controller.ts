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
import { EndpointsService } from './endpoints.service';

@Controller('api/v1/webhooks')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @Get()
  @UseGuards(JWTAuthGuard)
  async list(@Req() req: any) {
    return this.endpointsService.list(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JWTAuthGuard)
  async get(@Req() req: any, @Param('id') id: string) {
    return this.endpointsService.get(id, req.user.sub);
  }

  @Post()
  @UseGuards(JWTAuthGuard)
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
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.endpointsService.delete(id, req.user.sub);
    return { success: true };
  }

  @Post(':id/rotate-secret')
  @UseGuards(JWTAuthGuard)
  async rotateSecret(@Req() req: any, @Param('id') id: string) {
    return this.endpointsService.rotateSecret(id, req.user.sub);
  }

  @Get(':id/deliveries')
  @UseGuards(JWTAuthGuard)
  async getDeliveries(
    @Req() req: any,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    return this.endpointsService.getDeliveries(id, req.user.sub, limitNum);
  }
}
